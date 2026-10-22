/**
 * make-icons.js — rasterises the SVG favicon into PNG app icons.
 *   node tools/make-icons.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ICON_DIR = path.join(__dirname, '..', 'assets', 'icons');
const SRC = path.join(ICON_DIR, 'favicon.svg');

(async () => {
  const svg = fs.readFileSync(SRC);
  const targets = [
    { file: 'favicon-32.png', size: 32 },
    { file: 'favicon-16.png', size: 16 },
    { file: 'apple-touch-icon.png', size: 180 },
    { file: 'icon-192.png', size: 192 },
    { file: 'icon-512.png', size: 512 }
  ];
  for (const t of targets) {
    await sharp(svg, { density: 400 })
      .resize(t.size, t.size)
      .png({ compressionLevel: 9 })
      .toFile(path.join(ICON_DIR, t.file));
    console.log('wrote', t.file);
  }
})();
