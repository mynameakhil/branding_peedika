/**
 * make-og.js — renders the Open Graph / Twitter share image (1200x630).
 *   node tools/make-og.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'images');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#142B4A"/>
      <stop offset="1" stop-color="#0B1930"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="1030" cy="120" r="220" fill="#F2B544" opacity="0.12"/>
  <circle cx="1120" cy="540" r="170" fill="#1E3A61" opacity="0.7"/>
  <g stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="1">
    <line x1="0" y1="90" x2="1200" y2="90"/><line x1="0" y1="210" x2="1200" y2="210"/>
    <line x1="0" y1="330" x2="1200" y2="330"/><line x1="0" y1="450" x2="1200" y2="450"/>
    <line x1="0" y1="570" x2="1200" y2="570"/>
  </g>
  <g font-family="Helvetica Neue, Arial, sans-serif">
    <rect x="80" y="78" width="70" height="70" rx="16" fill="#142B4A" stroke="#F2B544" stroke-width="2"/>
    <g fill="none" stroke="#F2B544" stroke-width="6" stroke-linecap="square" transform="translate(95,93) scale(0.66)">
      <path d="M19 47V17h10a8 8 0 0 1 0 15H19"/>
      <path d="M19 32h12a8 8 0 0 1 0 15H19"/>
      <path d="M41 47V17h8a8 8 0 0 1 0 15h-8"/>
    </g>
    <text x="168" y="112" font-size="34" font-weight="700" fill="#FFFFFF" font-family="Helvetica Neue, Arial, sans-serif">Branding Peedika</text>
    <text x="170" y="142" font-size="16" fill="#8FA0B4" letter-spacing="3">WHERE EVERY BRAND BEGINS</text>
    <line x1="80" y1="200" x2="230" y2="200" stroke="#F2B544" stroke-width="4"/>
    <text x="80" y="288" font-size="62" font-weight="700" fill="#FFFFFF" font-family="Helvetica Neue, Arial, sans-serif">Digital Marketing for</text>
    <text x="80" y="356" font-size="62" font-weight="700" fill="#FFFFFF" font-family="Helvetica Neue, Arial, sans-serif">Small Businesses in Kerala</text>
    <text x="80" y="416" font-size="23" fill="#B9C4D2" font-family="Helvetica Neue, Arial, sans-serif">Branding · Social media · Content · Websites · Digital marketing</text>
    <rect x="80" y="470" width="236" height="56" rx="28" fill="#F2B544"/>
    <text x="198" y="506" text-anchor="middle" font-size="19" font-weight="700" fill="#0B1930" font-family="Helvetica Neue, Arial, sans-serif">Let&#39;s Grow Your Brand</text>
  </g>
  <rect x="0" y="606" width="1200" height="24" fill="#F2B544"/>
</svg>`;

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const buf = Buffer.from(svg);
  await sharp(buf, { density: 144 })
    .resize(1200, 630)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, 'og-branding-peedika.png'));
  await sharp(buf, { density: 144 })
    .resize(1200, 630)
    .webp({ quality: 82 })
    .toFile(path.join(OUT_DIR, 'og-branding-peedika.webp'));
  console.log('OG image written');
})();
