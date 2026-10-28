import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function versionUnits(version) {
  const match = /^(\d+)\.(\d)$/.exec(String(version));
  if (!match) throw new Error(`Invalid version: ${version}. Expected one decimal place.`);
  const units = Number(match[1]) * 10 + Number(match[2]);
  if (!Number.isSafeInteger(units)) throw new Error('Version exceeds the supported range.');
  return units;
}

export function nextVersion(currentVersion) {
  const units = versionUnits(currentVersion) + 1;
  return `${Math.floor(units / 10)}.${units % 10}`;
}

export function htmlVersion(html) {
  const match = /<meta\s+name="application-version"\s+content="([^"]+)"\s*\/?\s*>/i.exec(html);
  if (!match) throw new Error('The page is missing its application-version metadata.');
  versionUnits(match[1]);
  return match[1];
}

export async function publishedVersion(baseUrl, fetcher = fetch) {
  const base = new URL(baseUrl);
  if (base.protocol !== 'https:' && base.hostname !== 'localhost' && base.hostname !== '127.0.0.1') {
    throw new Error('The published site URL must use HTTPS.');
  }
  async function request(pathname) {
    const target = new URL(pathname, base);
    target.searchParams.set('version-check', `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const response = await fetcher(target, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(15000),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Cannot read the published version (${response.status}).`);
    return response.text();
  }
  const manifest = await request('/version.json');
  if (manifest !== null) {
    const version = JSON.parse(manifest).version;
    versionUnits(version);
    return version;
  }
  // The existing live demo predates version.json. Bootstrap from its HTML metadata.
  const html = await request('/');
  return html === null ? null : htmlVersion(html);
}

export function stampVersion(html, version) {
  versionUnits(version);
  htmlVersion(html);
  let labels = 0;
  const updated = html
    .replace(/(<meta\s+name="application-version"\s+content=")[^"]+("\s*\/?\s*>)/i, `$1${version}$2`)
    .replace(/(<span(?: class="splash-version")?>)Version \d+\.\d+(<\/span>)/g, (_, before, after) => {
      labels++;
      return `${before}Version ${version}${after}`;
    });
  if (labels !== 2) throw new Error(`Expected splash and footer version labels, found ${labels}.`);
  return updated;
}

export async function build({ root, env = process.env, fetcher = fetch } = {}) {
  root ??= path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  const sourceVersion = htmlVersion(html);
  const siteUrl = env.CONTEXT && env.CONTEXT !== 'production'
    ? (env.DEPLOY_PRIME_URL || env.URL)
    : env.URL;
  if (env.NETLIFY === 'true' && !siteUrl) {
    throw new Error('Netlify did not provide a site URL. Refusing to reset the version.');
  }
  const liveVersion = siteUrl ? await publishedVersion(siteUrl, fetcher) : null;
  const baseline = liveVersion && versionUnits(liveVersion) > versionUnits(sourceVersion)
    ? liveVersion : sourceVersion;
  const version = nextVersion(baseline);
  const output = path.join(root, 'dist');
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'index.html'), stampVersion(html, version));
  await writeFile(path.join(output, 'version.json'), JSON.stringify({
    version,
    previousVersion: baseline,
    commit: env.COMMIT_REF || null,
    builtAt: new Date().toISOString(),
  }, null, 2) + '\n');
  console.log(`Bridges Learning Studio: ${baseline} -> ${version}`);
  return { version, output };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  build().catch(error => {
    console.error(`Version build failed: ${error.message}`);
    process.exitCode = 1;
  });
}
