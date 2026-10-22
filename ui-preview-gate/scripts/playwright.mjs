// Resolve Playwright from PLAYWRIGHT_MODULE or the normal module path.
export async function loadChromium() {
  const target = process.env.PLAYWRIGHT_MODULE || 'playwright';
  try {
    const mod = await import(target);
    return mod.chromium ?? mod.default.chromium;
  } catch (err) {
    console.error(
      `Could not load Playwright from "${target}".\n` +
        'Install it with: npm i -D playwright && npx playwright install chromium\n' +
        'or set PLAYWRIGHT_MODULE to an existing playwright/index.mjs.'
    );
    throw err;
  }
}
