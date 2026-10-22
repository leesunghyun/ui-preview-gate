#!/usr/bin/env node
// Capture a page at a fixed viewport and print element rectangles for boxes.
//
// node capture.mjs --url <url> --out <png> [--width 375] [--height 812]
//   [--scale 2] [--full-page] [--wait <ms>] [--selector <css>]...
import { loadChromium } from './playwright.mjs';

function parseArgs(argv) {
  const opts = { width: 375, height: 812, scale: 2, wait: 500, fullPage: false, selectors: [] };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`Missing value for ${key}`);
      return argv[++i];
    };
    switch (key) {
      case '--url': opts.url = next(); break;
      case '--out': opts.out = next(); break;
      case '--width': opts.width = Number(next()); break;
      case '--height': opts.height = Number(next()); break;
      case '--scale': opts.scale = Number(next()); break;
      case '--wait': opts.wait = Number(next()); break;
      case '--full-page': opts.fullPage = true; break;
      case '--selector': opts.selectors.push(next()); break;
      default: throw new Error(`Unknown argument: ${key}`);
    }
  }
  if (!opts.url || !opts.out) throw new Error('--url and --out are required');
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
const chromium = await loadChromium();
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: opts.width, height: opts.height },
    deviceScaleFactor: opts.scale,
  });
  await page.goto(opts.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(opts.wait);

  const boxes = [];
  for (const selector of opts.selectors) {
    const rects = await page.$$eval(
      selector,
      (els, fullPage) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          const dx = fullPage ? window.scrollX : 0;
          const dy = fullPage ? window.scrollY : 0;
          return { x: Math.round(r.x + dx), y: Math.round(r.y + dy), w: Math.round(r.width), h: Math.round(r.height) };
        }),
      opts.fullPage
    );
    if (rects.length === 0) console.error(`No element matched: ${selector}`);
    for (const rect of rects) boxes.push({ selector, ...rect });
  }

  await page.screenshot({ path: opts.out, fullPage: opts.fullPage });
  console.log(JSON.stringify({ out: opts.out, width: opts.width, boxes }, null, 2));
} finally {
  await browser.close();
}
