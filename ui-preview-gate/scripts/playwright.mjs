// Resolve Playwright from PLAYWRIGHT_MODULE, the normal module path, or an
// existing install whose headless Chromium is already in the browser cache.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SKIP = new Set(['node_modules', '.git', 'build', 'dist', '.dart_tool', 'Pods']);

function browserCache() {
  return process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), 'Library/Caches/ms-playwright');
}

function headlessRevision(playwrightDir) {
  try {
    const file = path.join(playwrightDir, '..', 'playwright-core', 'browsers.json');
    const { browsers } = JSON.parse(readFileSync(file, 'utf8'));
    return browsers.find((b) => b.name === 'chromium-headless-shell')?.revision ?? null;
  } catch {
    return null;
  }
}

// Look for <dir>/node_modules/playwright up to `depth` levels below each root.
function findInstalls(root, depth, out = []) {
  const candidate = path.join(root, 'node_modules', 'playwright');
  if (existsSync(path.join(candidate, 'index.mjs'))) out.push(candidate);
  if (depth === 0) return out;
  let entries = [];
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.isDirectory() && !SKIP.has(e.name) && !e.name.startsWith('.')) {
      findInstalls(path.join(root, e.name), depth - 1, out);
    }
  }
  return out;
}

// Newest install whose chromium-headless-shell revision is already downloaded.
export function findCachedInstall(roots = (process.env.PLAYWRIGHT_SEARCH_ROOTS || path.join(os.homedir(), 'workspace')).split(path.delimiter)) {
  const cache = browserCache();
  let best = null;
  for (const root of roots) {
    for (const dir of findInstalls(root, 4)) {
      const rev = headlessRevision(dir);
      if (!rev || !existsSync(path.join(cache, `chromium_headless_shell-${rev}`))) continue;
      if (!best || Number(rev) > Number(best.rev)) best = { dir, rev };
    }
  }
  return best;
}

function pick(mod) {
  return mod.chromium ?? mod.default.chromium;
}

export async function loadChromium() {
  if (process.env.PLAYWRIGHT_MODULE) return pick(await import(process.env.PLAYWRIGHT_MODULE));
  try {
    const mod = await import('playwright');
    const rev = headlessRevision(path.dirname(new URL(import.meta.resolve('playwright')).pathname));
    if (!rev || existsSync(path.join(browserCache(), `chromium_headless_shell-${rev}`))) return pick(mod);
  } catch {
    // fall through to the cached-install search
  }
  const found = findCachedInstall();
  if (found) {
    console.error(`Using Playwright at ${found.dir} (cached headless Chromium ${found.rev}).`);
    return pick(await import(pathToFileURL(path.join(found.dir, 'index.mjs')).href));
  }
  throw new Error(
    'No Playwright install with a downloaded headless Chromium was found.\n' +
      'Install it with: npm i -D playwright && npx playwright install chromium\n' +
      'or set PLAYWRIGHT_MODULE to an existing playwright/index.mjs.'
  );
}
