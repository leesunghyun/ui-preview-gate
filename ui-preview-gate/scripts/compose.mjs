#!/usr/bin/env node
// Compose screenshots side by side with colored boxes into one PNG.
//
// node compose.mjs <spec.json>   (format: references/compose-spec.md)
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadChromium } from './playwright.mjs';

const TONES = {
  before: '#dc2626',
  after: '#16a34a',
  mismatch: '#f59e0b',
  neutral: '#6b7280',
};

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function tone(name) {
  const color = TONES[name ?? 'neutral'];
  if (!color) throw new Error(`Unknown tone "${name}". Use: ${Object.keys(TONES).join(', ')}`);
  return color;
}

async function dataUri(file) {
  const mime = MIME[path.extname(file).toLowerCase()];
  if (!mime) throw new Error(`Unsupported image type: ${file}`);
  return `data:${mime};base64,${(await readFile(file)).toString('base64')}`;
}

// PNG natural size from the IHDR chunk; null for other formats.
async function pngSize(file) {
  if (path.extname(file).toLowerCase() !== '.png') return null;
  const buf = await readFile(file);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

const MIN_PAD = 6;
const MIN_LABEL_BOX_H = 48;
const MAX_MISMATCH_AREA = 0.25;

// Spec rules that agents kept skipping. Violations stop the compose.
async function lint(spec, baseDir, width) {
  const errors = [];
  if (spec.panels.length !== 2) {
    errors.push(`Image has ${spec.panels.length} panels. Use exactly one pair (before|after or approved|actual) per image; make a separate image for each state.`);
  }
  if ((spec.boxPadding ?? MIN_PAD) < MIN_PAD) errors.push(`boxPadding ${spec.boxPadding} < ${MIN_PAD}: borders will cover text.`);
  for (const [i, panel] of spec.panels.entries()) {
    const name = `panel ${i + 1} (${panel.label ?? 'no label'})`;
    if (!panel.label) errors.push(`${name}: needs a label.`);
    if ((panel.boxPadding ?? MIN_PAD) < MIN_PAD) errors.push(`${name}: boxPadding ${panel.boxPadding} < ${MIN_PAD}.`);
    const pw = panel.width ?? width;
    const scale = pw / (panel.sourceWidth ?? pw);
    const size = panel.image ? await pngSize(path.resolve(baseDir, panel.image)) : null;
    const panelArea = size ? pw * (size.h * pw / size.w) : null;
    for (const [j, b] of (panel.boxes ?? []).entries()) {
      if (b.label && b.h * scale < MIN_LABEL_BOX_H) {
        errors.push(`${name} box ${j + 1}: label on a ${Math.round(b.h * scale)}px box covers neighbouring text. Remove the label and explain in the panel note.`);
      }
      if ((b.tone ?? panel.tone) === 'mismatch' && panelArea) {
        const ratio = (b.w * scale * b.h * scale) / panelArea;
        if (ratio > MAX_MISMATCH_AREA) {
          errors.push(`${name} box ${j + 1}: mismatch box covers ${Math.round(ratio * 100)}% of the screen. Box only the element that differs.`);
        }
      }
    }
  }
  return errors;
}

async function panelHtml(panel, defaultWidth, baseDir, defaultPad, anyStaged) {
  if (!panel.image) throw new Error('Each panel needs an "image"');
  const width = panel.width ?? defaultWidth;
  const scale = width / (panel.sourceWidth ?? width);
  const pad = panel.boxPadding ?? defaultPad;
  const panelColor = tone(panel.tone);
  const boxes = (panel.boxes ?? [])
    .map((b) => {
      const color = tone(b.tone ?? panel.tone);
      const tag = b.label ? `<span class="tag" style="background:${color}">${esc(b.label)}</span>` : '';
      const p = b.pad ?? pad;
      const left = b.x * scale - p;
      const top = b.y * scale - p;
      return `<div class="box" style="left:${left}px;top:${top}px;width:${b.w * scale + 2 * p}px;height:${b.h * scale + 2 * p}px;border-color:${color}">${tag}</div>`;
    })
    .join('');
  const src = await dataUri(path.resolve(baseDir, panel.image));
  const badge = panel.mockup ? ' <span class="mock">MOCKUP</span>' : '';
  // Keep both screenshots aligned: unstaged panels get an invisible placeholder.
  const staged = panel.staged
    ? `<div class="staged">STAGED: ${esc(panel.staged)}</div>`
    : anyStaged ? '<div class="staged" style="visibility:hidden">STAGED</div>' : '';
  return `<div class="col" style="width:${width}px">
  <div class="lab" style="color:${panelColor}">${esc(panel.label)}${badge}</div>
  ${staged}
  <div class="shot${panel.mockup ? ' mockup' : ''}"><img src="${src}" style="width:${width}px">${boxes}</div>
  ${panel.note ? `<div class="note">${esc(panel.note)}</div>` : ''}
</div>`;
}

const specPath = process.argv[2];
if (!specPath) {
  console.error('Usage: node compose.mjs <spec.json>');
  process.exit(1);
}
const spec = JSON.parse(await readFile(specPath, 'utf8'));
const baseDir = path.dirname(path.resolve(specPath));
if (!Array.isArray(spec.panels) || spec.panels.length === 0) throw new Error('spec.panels must be a non-empty array');
const out = path.resolve(baseDir, spec.out ?? 'before-after.png');
const width = spec.width ?? 375;

const problems = await lint(spec, baseDir, width);
if (problems.length) {
  console.error('Spec violates the preview rules; no image written:');
  for (const p of problems) console.error(`- ${p}`);
  process.exit(2);
}

const boxPadding = spec.boxPadding ?? 6;
const anyStaged = spec.panels.some((p) => p.staged);
const cols = await Promise.all(spec.panels.map((p) => panelHtml(p, width, baseDir, boxPadding, anyStaged)));
const caption = spec.caption ? `<div class="caption">${esc(spec.caption)}</div>` : '';
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#fff;font-family:-apple-system,"Segoe UI","Hiragino Sans","Noto Sans",sans-serif}
#sheet{display:inline-flex;flex-direction:column;gap:14px;padding:24px}
#row{display:flex;align-items:flex-start;gap:28px}
.caption{font-size:15px;line-height:1.4;color:#111827;background:#f3f4f6;border-radius:8px;padding:8px 12px}
.staged{font-size:13px;line-height:1.3;color:#78350f;background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:4px 8px;text-align:center}
.col{display:flex;flex-direction:column;align-items:center;gap:10px}
.lab{font-weight:700;font-size:20px;line-height:1.2}
.shot{position:relative;border:1px solid #ccc;line-height:0}
.shot img{display:block}
.shot.mockup{border:3px dashed #6b7280}
.mock{display:inline-block;vertical-align:middle;margin-left:8px;padding:3px 8px;border-radius:6px;background:#111827;color:#fff;font-size:13px;letter-spacing:.05em}
.box{position:absolute;border:4px solid;border-radius:10px;box-sizing:border-box}
.tag{position:absolute;top:-12px;left:6px;color:#fff;font-weight:700;font-size:12px;line-height:1;padding:3px 6px;border-radius:6px;white-space:nowrap}
.note{font-size:14px;line-height:1.4;text-align:center;color:#333}
</style><div id="sheet">${caption}<div id="row">${cols.join('')}</div></div>`;

const chromium = await loadChromium();
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 800, height: 600 } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.locator('#sheet').screenshot({ path: out });
  console.log(out);
  console.log(`Before sending, open ${path.basename(out)} and confirm each item (copy the answers into the message):
1. Every box sits on its target and no border or tag covers text.
2. Both sides show the same state, scroll, and data; any unavoidable difference is in "caption".
3. Every changed region is boxed on both sides at matching places.
4. Screens the normal flow cannot reach are marked with "staged".
5. Labels, notes, and caption use the approver's language only.
6. Verification: every amber box is a difference you re-captured and could not fix, boxed tightly.`);
} finally {
  await browser.close();
}
