/**
 * meta.js — fetch full metadata (description, categories, author) for review
 *   node tools/meta.js '<titles separated by |>'
 */
const UA = 'BrandingPeedikaAssetBot/1.0 (asset review)';

(async () => {
  const titles = process.argv[2].split('|>').map((s) => s.trim()).filter(Boolean);
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&titles=' +
    encodeURIComponent(titles.join('|')) +
    '&prop=imageinfo&iiprop=url|size|mime|extmetadata&format=json';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const json = await res.json();
  for (const p of Object.values(json.query.pages)) {
    if (!p.imageinfo) { console.log('MISS ' + p.title); continue; }
    const ii = p.imageinfo[0];
    const m = ii.extmetadata || {};
    const g = (k) => (m[k] && m[k].value ? String(m[k].value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '');
    console.log('\n############ ' + p.title);
    console.log('  size      : ' + ii.width + 'x' + ii.height + '  ' + ii.mime);
    console.log('  license   : ' + g('LicenseShortName') + '  | ' + g('UsageTerms'));
    console.log('  artist    : ' + g('Artist').slice(0, 90));
    console.log('  date      : ' + g('DateTimeOriginal'));
    console.log('  desc      : ' + g('ImageDescription').slice(0, 400));
    console.log('  cats      : ' + g('Categories').slice(0, 320));
    console.log('  page      : ' + ii.descriptionurl);
  }
})();
