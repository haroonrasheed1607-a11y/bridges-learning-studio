function checked(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
export function createWorkspaceRepository(client) {
  return {
    async load() {
      const [groups, students, members, activities, versions, attempts] =
        await Promise.all([
          client.from("student_groups").select("*").order("created_at"),
          client.from("student_profiles").select("*").order("created_at"),
          client.from("group_members").select("*"),
          client.from("activities").select("*").order("created_at"),
          client
            .from("activity_versions")
            .select("*")
            .eq("status", "ready")
            .order("version_number"),
          client
            .from("student_attempts")
            .select("*")
            .order("completed_at", { ascending: false }),
        ]).then((results) => results.map(checked));
      const groupRows = groups.map((group) => ({ ...group, count: 0 }));
      return {
        groups: groupRows,
        students: students.map((student) => {
          const groupIds = members
            .filter((m) => m.student_id === student.id)
            .map((m) => m.group_id);
          return {
            id: student.student_code,
            dbId: student.id,
            name: student.name,
            email: student.email,
            groupIds,
            group: Math.max(
              0,
              groups.findIndex((g) => groupIds.includes(g.id)),
            ),
          };
        }),
        activities: activities
          .filter((a) => a.current_version_id)
          .map((a) => {
            const v = versions.find((v) => v.id === a.current_version_id);
            return {
              ...v?.definition,
              id: a.id,
              title: a.title,
              kind: a.kind,
              type: a.mode === "teaching" ? "Teaching" : "Assessment",
              versionId: v?.id,
              versionNumber: v?.version_number,
              sourcePath: v?.source_path,
              status: "Saved",
            };
          }),
        versions,
        attempts,
      };
    },
    async addGroup(name) {
      return checked(
        await client.rpc("create_student_group", { p_name: name }),
      );
    },
    async addStudents(rows, groups) {
      return checked(
        await client.rpc("import_students", {
          p_rows: rows.map((row) => ({
            name: row.name,
            student_code: row.id,
            group_id: groups[row.group].id,
          })),
        }),
      );
    },
    async saveActivity(activity, definition, prompts, source) {
      const reserved = checked(
        await client.rpc("reserve_activity_version", {
          p_activity_id: activity.id,
          p_definition: definition,
          p_prompts: prompts,
        }),
      );
      // Never upsert: every version has a unique object key and existing source must stay immutable.
      checked(
        await client.storage
          .from("activity-files")
          .upload(
            reserved.source_path,
            new Blob([source], { type: "text/plain" }),
            { upsert: false, contentType: "text/plain" },
          ),
      );
      checked(
        await client.rpc("finalize_activity_version", {
          p_version_id: reserved.version_id,
        }),
      );
      return reserved;
    },
    async loadVersion(version) {
      const file = checked(
        await client.storage
          .from("activity-files")
          .download(version.source_path),
      );
      return {
        source: await file.text(),
        definition: version.definition,
        prompts: version.prompts,
        version,
      };
    },
    async assignActivity(versionId, groupIds) {
      return checked(
        await client.rpc("assign_activity", {
          p_version_id: versionId,
          p_group_ids: groupIds,
        }),
      );
    },
    async recordAttempt({
      attemptId,
      studentId,
      versionId,
      answers,
      assignmentId = null,
    }) {
      return checked(
        await client.rpc("record_student_attempt", {
          p_attempt_id: attemptId,
          p_student_id: studentId,
          p_version_id: versionId,
          p_answers: answers,
          p_assignment_id: assignmentId,
        }),
      );
    },
  };
}
