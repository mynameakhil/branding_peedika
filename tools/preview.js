/**
 * preview.js — downloads small thumbnails of candidate images so they can be
 * visually reviewed before being committed to the final asset list.
 *   node tools/preview.js '<comma separated Commons File: titles>'
 */
const fs = require('fs');
const path = require('path');
const UA = 'BrandingPeedikaAssetBot/1.0 (asset review)';
const OUT = path.join(__dirname, 'preview');

(async () => {
  const titles = process.argv[2].split('|').map((s) => s.trim()).filter(Boolean);
  fs.mkdirSync(OUT, { recursive: true });
  const list = [];
  for (const t of titles) {
    const url =
      'https://commons.wikimedia.org/w/api.php?action=query&titles=' +
      encodeURIComponent(t) +
      '&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=640&format=json';
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const json = await res.json();
    const page = Object.values(json.query.pages)[0];
    if (!page || !page.imageinfo) { console.log('MISS ' + t); continue; }
    const ii = page.imageinfo[0];
    const meta = ii.extmetadata || {};
    const img = await fetch(ii.thumburl, { headers: { 'User-Agent': UA } });
    const buf = Buffer.from(await img.arrayBuffer());
    const name = String(list.length + 1).padStart(2, '0') + '-' + t.replace(/^File:/, '').replace(/[^a-z0-9]+/gi, '-').slice(0, 48) + '.jpg';
    fs.writeFileSync(path.join(OUT, name), buf);
    list.push({
      idx: list.length + 1,
      file: name,
      title: t,
      license: (meta.LicenseShortName && meta.LicenseShortName.value) || '?',
      artist: String((meta.Artist && meta.Artist.value) || '').replace(/<[^>]*>/g, '').trim().slice(0, 60),
      page: ii.descriptionurl
    });
    console.log(`${list.length}. ${name}  [${list[list.length-1].license}]`);
    await new Promise((r) => setTimeout(r, 600));
  }
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(list, null, 2));
})();
