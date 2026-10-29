import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const alice = "10000000-0000-4000-8000-000000000001",
  bob = "10000000-0000-4000-8000-000000000002";

test("workspace SQL enforces school boundaries, immutable versions and server-side scoring", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon;create role authenticated; create schema auth;create schema storage;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,storage to authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;grant select,insert,update,delete on storage.objects to authenticated;
 insert into auth.users values('${alice}'),('${bob}');`);
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/20261028233440_school_workspace.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/20261028234026_workspace_indexes_and_lineage.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec(await readFile(new URL(
      "../supabase/migrations/20261029145921_optional_student_class.sql", import.meta.url), "utf8"));
    const as = async (user, sql, params = []) => {
      await db.exec(
        `reset role;select set_config('request.jwt.claim.sub','${user}',false);set role authenticated;`,
      );
      return db.query(sql, params);
    };
    const first = await as(
      alice,
      "select public.create_school_workspace('School A','Alice') id",
    );
    const school = first.rows[0].id;
    // A fresh school with no groups can register a learner.
    await as(alice, "select public.import_students($1::jsonb)", [
      JSON.stringify([{ student_code: "U1", name: "Unassigned", group_id: null }]),
    ]);
    assert.equal((await as(alice, "select count(*)::int n from public.student_profiles where student_code='U1'")).rows[0].n, 1);
    assert.equal((await as(alice, "select count(*)::int n from public.group_members")).rows[0].n, 0);
    await assert.rejects(as(alice, "select public.import_students($1::jsonb)", [
      JSON.stringify([{ student_code: "INVALID", name: "Invalid", group_id: "99999999-0000-4000-8000-000000000000" }]),
    ]), /Unknown group/);
    const ga = (
      await as(alice, "select public.create_student_group('Section A') id")
    ).rows[0].id;
    await as(alice, "select public.import_students($1::jsonb)", [
      JSON.stringify([{ student_code: "A1", name: "Learner", group_id: ga }]),
    ]);
    const student = (await as(alice, "select id from public.student_profiles where student_code='A1'"))
      .rows[0].id;
    await assert.rejects(
      as(alice, "select public.import_students($1::jsonb)", [
        JSON.stringify([
          { student_code: "A1", name: "Duplicate", group_id: ga },
        ]),
      ]),
      /unique/,
    );
    const id = "20000000-0000-4000-8000-000000000001";
    const definition = {
      title: "Colors",
      kind: "color",
      mode: "assessment",
      questions: [{ id: "q1", answer: "Red", concept: "colors", points: 1 }],
    };
    const reserve = async () =>
      (
        await as(
          alice,
          "select public.reserve_activity_version($1,$2::jsonb,$3::jsonb) version",
          [id, JSON.stringify(definition), "[]"],
        )
      ).rows[0].version;
    const v1 = await reserve();
    await assert.rejects(
      as(alice, "select public.finalize_activity_version($1)", [v1.version_id]),
      /upload has not completed/,
    );
    await as(
      alice,
      "insert into storage.objects(bucket_id,name) values('activity-files',$1)",
      [v1.source_path],
    );
    await as(alice, "select public.finalize_activity_version($1)", [
      v1.version_id,
    ]);
    const v2 = await reserve();
    assert.equal(v2.version_number, 2);
    assert.notEqual(v1.source_path, v2.source_path);
    // An older upload cannot override the latest finalized version.
    await as(
      alice,
      "insert into storage.objects(bucket_id,name) values('activity-files',$1)",
      [v2.source_path],
    );
    await as(alice, "select public.finalize_activity_version($1)", [
      v2.version_id,
    ]);
    await as(alice, "select public.finalize_activity_version($1)", [
      v1.version_id,
    ]);
    assert.equal(
      (await as(alice, "select current_version_id from public.activities"))
        .rows[0].current_version_id,
      v2.version_id,
    );
    const assignment = (
      await as(alice, "select public.assign_activity($1,$2) result", [
        v1.version_id,
        [ga],
      ])
    ).rows[0].result;
    assert.equal(assignment.student_count, 1);
    const attempt = "30000000-0000-4000-8000-000000000001";
    await as(
      alice,
      "select public.record_student_attempt($1,$2,$3,$4::jsonb,$5)",
      [
        attempt,
        student,
        v1.version_id,
        '{"q1":"Blue","score":999}',
        assignment.assignment_id,
      ],
    );
    assert.equal(
      (await as(alice, "select score from public.student_attempts")).rows[0]
        .score,
      "0",
    );
    assert.equal(
      (await as(alice, "select correct from public.attempt_answers")).rows[0]
        .correct,
      false,
    );
    await as(
      alice,
      "select public.record_student_attempt($1,$2,$3,$4::jsonb,$5)",
      [
        attempt,
        student,
        v1.version_id,
        '{"q1":"Blue"}',
        assignment.assignment_id,
      ],
    );
    assert.equal(
      (await as(alice, "select count(*) from public.student_attempts")).rows[0]
        .count,
      1,
    );
    await as(bob, "select public.create_school_workspace('School B','Bob')");
    assert.equal(
      (await as(bob, "select * from public.student_profiles")).rows.length,
      0,
    );
    assert.equal(
      (await as(bob, "select * from public.activity_versions")).rows.length,
      0,
    );
    assert.equal(
      (await as(bob, "select * from storage.objects")).rows.length,
      0,
    );
    await assert.rejects(
      as(
        bob,
        "select public.reserve_activity_version($1,$2::jsonb,$3::jsonb)",
        [id, JSON.stringify(definition), "[]"],
      ),
      /owner/,
    );
    await assert.rejects(
      as(bob, "select public.finalize_activity_version($1)", [v1.version_id]),
      /access denied/,
    );
    await assert.rejects(
      as(
        bob,
        "insert into storage.objects(bucket_id,name) values('activity-files',$1)",
        [v1.source_path],
      ),
      /row-level security/,
    );
    await as(alice, "select 1");
    await assert.rejects(
      as(alice, "update public.activity_versions set definition='{}'"),
      /permission denied/,
    );
    await db.exec("reset role;set role anon;");
    await assert.rejects(
      db.query("select * from public.student_profiles"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select public.create_school_workspace('Intruder','Intruder')"),
      /permission denied/,
    );
    assert.ok(school);
  } finally {
    await db.close();
  }
});
