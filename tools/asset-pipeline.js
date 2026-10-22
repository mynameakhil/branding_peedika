/**
 * asset-pipeline.js
 * ------------------------------------------------------------------
 * Downloads source images, optimises them, and writes responsive
 * WebP/AVIF variants into /assets/images.
 *
 * Usage:
 *   node tools/asset-pipeline.js fetch    # download sources listed in sources.json
 *   node tools/asset-pipeline.js build    # generate optimised variants
 *   node tools/asset-pipeline.js all      # fetch + build
 *
 * Sources are declared in tools/sources.json so the licensing record and
 * the build are both reviewable in one place.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(__dirname, 'source');
const OUT_DIR = path.join(ROOT, 'assets', 'images');
const SOURCES = require('./sources.json');

const UA = 'BrandingPeedikaAssetBot/1.0 (static-site asset pipeline)';

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
async function commonsInfo(title) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&titles=' +
    encodeURIComponent(title) +
    '&prop=imageinfo&iiprop=url|size|extmetadata&format=json';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const json = await res.json();
  const pages = json.query.pages;
  const page = Object.values(pages)[0];
  if (!page || !page.imageinfo) throw new Error('No imageinfo for ' + title);
  const ii = page.imageinfo[0];
  const meta = ii.extmetadata || {};
  return {
    url: ii.url,
    width: ii.width,
    height: ii.height,
    descriptionurl: ii.descriptionurl,
    license: (meta.LicenseShortName && meta.LicenseShortName.value) || 'unknown',
    licenseUrl: (meta.LicenseUrl && meta.LicenseUrl.value) || '',
    artist: stripHtml((meta.Artist && meta.Artist.value) || 'Unknown'),
    credit: stripHtml((meta.Credit && meta.Credit.value) || '')
  };
}

function stripHtml(s) {
  return String(s)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function download(url, dest) {
  const clean = url.split('?')[0];
  let lastErr;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(clean, { headers: { 'User-Agent': UA } });
      if (res.status === 429 || res.status === 503) {
        await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + clean);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
      return buf;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
  throw lastErr || new Error('download failed ' + clean);
}

/* ------------------------------------------------------------------ */
/* fetch                                                               */
/* ------------------------------------------------------------------ */
async function fetchSources() {
  fs.mkdirSync(SRC_DIR, { recursive: true });
  const manifest = [];
  for (const src of SOURCES.images) {
    const dest = path.join(SRC_DIR, src.file);
    if (fs.existsSync(dest) && !src.refetch) {
      console.log('skip  ' + src.file);
      manifest.push(src);
      continue;
    }
    process.stdout.write('get   ' + src.file + ' ... ');
    try {
      let info = src.commonsTitle
        ? await commonsInfo(src.commonsTitle)
        : { url: src.url, license: src.license, artist: src.artist, descriptionurl: src.sourcePage || '' };
      await download(info.url, dest);
      manifest.push({ ...src, ...info });
      console.log('ok');
    } catch (err) {
      console.log('FAILED ' + err.message);
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  fs.writeFileSync(path.join(__dirname, 'sources.resolved.json'), JSON.stringify(manifest, null, 2));
  console.log('\nresolved manifest written to tools/sources.resolved.json');
}

/* ------------------------------------------------------------------ */
/* build                                                               */
/* ------------------------------------------------------------------ */
const WIDTHS = {
  hero: [640, 960, 1280, 1600],
  wide: [480, 768, 1024, 1440],
  card: [320, 480, 720, 960],
  thumb: [240, 360, 540]
};

async function buildOne(entry, resolved) {
  const srcPath = path.join(SRC_DIR, entry.file);
  if (!fs.existsSync(srcPath)) {
    console.log('miss  ' + entry.file);
    return;
  }
  const widths = WIDTHS[entry.size] || WIDTHS.card;
  const meta = resolved.find((r) => r.file === entry.file) || entry;
  const base = entry.out;
  const image = sharp(srcPath, { failOn: 'none' }).rotate();

  // base dimensions
  const { width: ow, height: oh } = await image.metadata();
  const ar = ow / oh;
  const record = { file: entry.file, out: base, width: ow, height: oh, variants: [], ...meta };

  for (const w of widths) {
    if (w > ow * 1.05) continue;
    const h = Math.round(w / ar);
    const name = `${base}-${w}.webp`;
    const outPath = path.join(OUT_DIR, name);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    await image
      .clone()
      .resize(w, h, { fit: 'cover', position: entry.focus || 'attention' })
      .webp({ quality: entry.quality || 76, effort: 5 })
      .toFile(outPath);
    const size = fs.statSync(outPath).size;

    // AVIF variant (quality slightly lower to keep size sane)
    const avifName = `${base}-${w}.avif`;
    const avifPath = path.join(OUT_DIR, avifName);
    await image
      .clone()
      .resize(w, h, { fit: 'cover', position: entry.focus || 'attention' })
      .avif({ quality: entry.avifQuality || 52, effort: 4 })
      .toFile(avifPath);
    const avifSize = fs.statSync(avifPath).size;

    record.variants.push({ w, h, webp: name, avif: avifName, webpKB: +(size / 1024).toFixed(1), avifKB: +(avifSize / 1024).toFixed(1) });
    console.log(`  ${name}  ${(size / 1024).toFixed(1)}KB webp / ${(avifSize / 1024).toFixed(1)}KB avif`);
  }
  return record;
}

async function build() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const resolved = JSON.parse(fs.readFileSync(path.join(__dirname, 'sources.resolved.json'), 'utf8'));
  const records = [];
  for (const entry of SOURCES.images) {
    const r = await buildOne(entry, resolved);
    if (r) records.push(r);
  }
  fs.writeFileSync(path.join(__dirname, 'manifest.json'), JSON.stringify(records, null, 2));
  console.log('\nmanifest written to tools/manifest.json');
}

/* ------------------------------------------------------------------ */
(async () => {
  const cmd = process.argv[2] || 'all';
  if (cmd === 'fetch' || cmd === 'all') await fetchSources();
  if (cmd === 'build' || cmd === 'all') await build();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
