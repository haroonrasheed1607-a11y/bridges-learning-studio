import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { nextVersion, publishedVersion, stampVersion, build } from './build-version.mjs';

const page = '<meta name="application-version" content="0.1"><span class="splash-version">Version 0.1</span><footer><span>Version 0.1</span></footer>';
const response = (text, status = 200) => new Response(text, { status });

test('increments in exact tenths, including the 0.9 boundary', () => {
  assert.equal(nextVersion('0.1'), '0.2');
  assert.equal(nextVersion('0.9'), '1.0');
  assert.equal(nextVersion('1.0'), '1.1');
  assert.throws(() => nextVersion('broken'));
});

test('bootstraps from the existing deployed HTML', async () => {
  const seen = [];
  const version = await publishedVersion('https://demo.netlify.app', async url => {
    seen.push(url.pathname);
    return url.pathname === '/version.json' ? response('', 404) : response(page);
  });
  assert.equal(version, '0.1');
  assert.deepEqual(seen, ['/version.json', '/']);
});

test('reads the current manifest and refuses failed or malformed responses', async () => {
  assert.equal(await publishedVersion('https://demo.netlify.app', async () => response('{"version":"0.8"}')), '0.8');
  await assert.rejects(publishedVersion('https://demo.netlify.app', async () => response('', 503)), /503/);
  await assert.rejects(publishedVersion('https://demo.netlify.app', async () => response('{"version":"bad"}')));
  await assert.rejects(publishedVersion('https://demo.netlify.app', async () => { throw new Error('Network unavailable'); }));
});

test('updates metadata, splash and footer together', () => {
  const updated = stampVersion(page, '0.2');
  assert.match(updated, /content="0.2"/);
  assert.equal((updated.match(/Version 0.2/g) || []).length, 2);
  assert.throws(() => stampVersion('<meta name="application-version" content="0.1">', '0.2'));
});

test('successive deployments and same-commit redeploys advance the published version', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'bridges-version-'));
  try {
    await writeFile(path.join(root, 'index.html'), page);
    let live = '0.1';
    const env = { NETLIFY: 'true', URL: 'https://demo.netlify.app', CONTEXT: 'production', COMMIT_REF: 'same-commit' };
    const fetcher = async () => response(JSON.stringify({ version: live }));
    const first = await build({ root, env, fetcher });
    assert.equal(first.version, '0.2');
    live = JSON.parse(await readFile(path.join(root, 'dist/version.json'), 'utf8')).version;
    const second = await build({ root, env, fetcher });
    assert.equal(second.version, '0.3');
    assert.match(await readFile(path.join(root, 'dist/index.html'), 'utf8'), /Version 0.3/);
    assert.equal(await readFile(path.join(root, 'index.html'), 'utf8'), page);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('new sites bootstrap from the source version', async () => {
  assert.equal(await publishedVersion('https://new.netlify.app', async () => response('', 404)), null);
});
