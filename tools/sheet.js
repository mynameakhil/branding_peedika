/**
 * sheet.js — builds a labelled contact sheet from tools/preview/*.jpg
 *   node tools/sheet.js <cols>
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

(async () => {
  const dir = path.join(__dirname, 'preview');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).sort();
  const cols = Number(process.argv[2] || 4);
  const cw = 320, ch = 240, pad = 8, labelH = 26;
  const rows = Math.ceil(files.length / cols);
  const W = cols * (cw + pad) + pad;
  const H = rows * (ch + labelH + pad) + pad;
  const composites = [];
  for (let i = 0; i < files.length; i++) {
    const buf = await sharp(path.join(dir, files[i]))
      .resize(cw, ch, { fit: 'cover' })
      .toBuffer();
    const col = i % cols, row = Math.floor(i / cols);
    const left = pad + col * (cw + pad);
    const top = pad + row * (ch + labelH + pad);
    composites.push({ input: buf, left, top });
    const n = String(i + 1);
    const svg = `<svg width="${cw}" height="${labelH}"><rect width="100%" height="100%" fill="#0B1930"/><text x="6" y="18" font-family="Arial" font-size="14" fill="#F2B544">${n} ${files[i].replace(/^\d+-/, '').replace(/\.jpg$/, '').slice(0, 38)}</text></svg>`;
    composites.push({ input: Buffer.from(svg), left, top: top + ch });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } })
    .composite(composites)
    .jpeg({ quality: 82 })
    .toFile(path.join(__dirname, 'preview', '_sheet.jpg'));
  console.log('sheet written', W, 'x', H, 'files:', files.length);
})();
