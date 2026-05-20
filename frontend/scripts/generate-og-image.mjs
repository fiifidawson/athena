import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const W = 1200;
const H = 630;
const BG = '#0a0a0f';
const TEXT = '#e2e8f0';
const MUTED = '#94a3b8';
const ACCENT = '#0ea5e9';

const logoSvg = readFileSync(resolve(root, 'public/logo.svg'));
const logoSize = 220;
// SVG is 2000x2000 — keep default density and resize down for a crisp result.
const logoPng = await sharp(logoSvg)
  .resize(logoSize, logoSize)
  .png()
  .toBuffer();

const textOverlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="55%" stop-color="#7dd3fc"/>
      <stop offset="100%" stop-color="${ACCENT}"/>
    </linearGradient>
    <style>
      .brand { font: 800 96px 'Inter','Segoe UI',system-ui,sans-serif; fill: url(#brand); letter-spacing: -3px; }
      .tag   { font: 600 40px 'Inter','Segoe UI',system-ui,sans-serif; fill: ${TEXT}; letter-spacing: -0.5px; }
      .sub   { font: 400 26px 'Inter','Segoe UI',system-ui,sans-serif; fill: ${MUTED}; }
      .badge { font: 500 20px 'Inter','Segoe UI',system-ui,sans-serif; fill: ${ACCENT}; letter-spacing: 2px; }
    </style>
  </defs>
  <text x="${W / 2}" y="395" text-anchor="middle" class="brand">athena.</text>
  <text x="${W / 2}" y="465" text-anchor="middle" class="tag">Automated ML for Drug Discovery</text>
  <text x="${W / 2}" y="515" text-anchor="middle" class="sub">End-to-end pipeline from data selection to benchmarking</text>
  <text x="${W / 2}" y="575" text-anchor="middle" class="badge">OPEN SOURCE · AUTOML · DRUG DISCOVERY</text>
</svg>
`;

const out = await sharp({
  create: {
    width: W,
    height: H,
    channels: 4,
    background: BG,
  },
})
  .composite([
    { input: logoPng, top: 70, left: Math.round((W - logoSize) / 2) },
    { input: Buffer.from(textOverlay) },
  ])
  .png({ compressionLevel: 9 })
  .toBuffer();

const outPath = resolve(root, 'public/og-image.png');
writeFileSync(outPath, out);

const meta = await sharp(out).metadata();
console.log(`Wrote ${outPath}`);
console.log(`Size: ${meta.width}x${meta.height}, ${out.length} bytes`);

// Verification: sample the four corners + center edge. They should equal BG.
const raw = await sharp(out).raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = raw.info;
const px = (x, y) => {
  const i = (y * width + x) * channels;
  return [raw.data[i], raw.data[i + 1], raw.data[i + 2]];
};
const expected = [0x0a, 0x0a, 0x0f];
const samples = {
  topLeft:     px(2, 2),
  topRight:    px(width - 3, 2),
  bottomLeft:  px(2, height - 3),
  bottomRight: px(width - 3, height - 3),
  topMidEdge:  px(width / 2 | 0, 2),
  bottomMid:   px(width / 2 | 0, height - 3),
};
let ok = true;
for (const [name, rgb] of Object.entries(samples)) {
  const match = rgb[0] === expected[0] && rgb[1] === expected[1] && rgb[2] === expected[2];
  if (!match) ok = false;
  console.log(`  ${name.padEnd(12)} rgb(${rgb.join(',')}) ${match ? 'OK' : 'MISMATCH (expected ' + expected.join(',') + ')'}`);
}
if (!ok) {
  console.error('Background verification FAILED — visible rectangle likely.');
  process.exit(1);
}
console.log('Background verified: blends with site color.');
