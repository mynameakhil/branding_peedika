/**
 * validate.js — static checks for the generated site.
 *
 *   node tools/validate.js
 *
 * Checks performed
 *   1. Every page exists, is non-empty and has a unique <title> and
 *      meta description.
 *   2. Every internal href and src resolves to a real file in the site root.
 *   3. Every internal page link points at a page that actually exists.
 *   4. Every <img> has an alt attribute, and width/height where it matters.
 *   5. Every page declares lang, a canonical, an OG image and a JSON-LD block.
 *   6. Headings appear in order (exactly one h1 per page).
 *   7. No leftover {{TOKEN}} placeholders in the output.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES = require('./pages.js');

let errors = 0;
let warnings = 0;

function fail(message) {
  errors += 1;
  console.log('  FAIL  ' + message);
}

function warn(message) {
  warnings += 1;
  console.log('  WARN  ' + message);
}

function ok(message) {
  console.log('  ok    ' + message);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
function routeToFile(urlPath) {
  const clean = urlPath.split('#')[0].split('?')[0];
  if (clean === '/' || clean === '') return path.join(ROOT, 'index.html');
  const direct = path.join(ROOT, clean);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  if (fs.existsSync(path.join(direct, 'index.html'))) return path.join(direct, 'index.html');
  return null;
}

function matchAll(html, pattern) {
  const out = [];
  let match;
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
  while ((match = re.exec(html)) !== null) out.push(match);
  return out;
}

function attr(tag, name) {
  const m = tag.match(new RegExp(name + '="([^"]*)"', 'i'));
  return m ? m[1] : null;
}

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */
/* assets/js/config.js is a plain object assignment, so it can be read by
   evaluating it against a throwaway `window`. That keeps this file in sync
   with the real configuration instead of duplicating it. */
const BP_KEYS = {
  email: 'email',
  phone: 'phone',
  whatsapp: 'whatsapp',
  address: 'address',
  hours: 'businessHours',
  tagline: 'tagline',
  businessName: 'businessName'
};

let BP_CONFIG = {};
try {
  const configSource = fs.readFileSync(path.join(ROOT, 'assets/js/config.js'), 'utf8');
  const fakeWindow = {};
  new Function('window', configSource)(fakeWindow);
  BP_CONFIG = fakeWindow.BP_CONFIG || {};
} catch (e) {
  console.log('  FAIL  could not read assets/js/config.js: ' + e.message);
  errors += 1;
}

/* ------------------------------------------------------------------ */
/* Run                                                                */
/* ------------------------------------------------------------------ */
const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();

console.log('\nBranding Peedika — site validation\n');

for (const page of PAGES) {
  const file = path.join(ROOT, page.file);
  console.log(page.file);

  if (!fs.existsSync(file)) {
    fail('page file does not exist');
    continue;
  }

  const html = fs.readFileSync(file, 'utf8');

  if (html.length < 500) fail('page looks empty');

  /* Placeholders ---------------------------------------------------- */
  if (/\{\{[\w:]+\}\}/.test(html)) fail('contains an unreplaced {{TOKEN}}');

  /* Title + description --------------------------------------------- */
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!titleMatch) {
    fail('no <title>');
  } else {
    const title = titleMatch[1].trim();
    if (title.length < 15 || title.length > 70) {
      warn('title length is ' + title.length + ' characters (aim 30-70): "' + title + '"');
    }
    if (titles.has(title)) fail('duplicate title, also on ' + titles.get(title));
    else {
      titles.set(title, page.file);
      ok('title (' + title.length + ' chars)');
    }
  }

  const descMatch = html.match(/<meta name="description" content="([^"]*)"/i);
  if (!descMatch) {
    fail('no meta description');
  } else {
    const desc = descMatch[1].trim();
    if (desc.length < 70 || desc.length > 165) {
      warn('meta description length is ' + desc.length + ' characters (aim 110-160)');
    }
    if (descriptions.has(desc)) fail('duplicate meta description, also on ' + descriptions.get(desc));
    else {
      descriptions.set(desc, page.file);
      ok('meta description (' + desc.length + ' chars)');
    }
  }

  /* Canonical -------------------------------------------------------- */
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]*)"/i);
  if (!canonicalMatch) fail('no canonical link');
  else {
    const url = canonicalMatch[1];
    if (!url.startsWith('https://brandingpeedika.in')) {
      warn('canonical does not use the configured domain: ' + url);
    }
    if (canonicals.has(url)) fail('duplicate canonical, also on ' + canonicals.get(url));
    else canonicals.set(url, page.file);
  }

  /* Head essentials -------------------------------------------------- */
  if (!/<html lang="en-IN">/i.test(html)) fail('missing lang="en-IN" on <html>');
  if (!/<meta property="og:image"/i.test(html)) fail('missing og:image');
  if (!/<meta name="twitter:card"/i.test(html)) fail('missing twitter:card');
  if (!/<meta name="viewport"/i.test(html)) fail('missing viewport meta');
  if (!/application\/ld\+json/i.test(html)) fail('missing JSON-LD');

  /* Robots directive ------------------------------------------------- */
  const robotsTags = matchAll(html, /<meta\s+name="robots"[^>]*>/gi);
  if (robotsTags.length === 0) fail('missing robots meta');
  else if (robotsTags.length > 1) {
    fail('more than one robots meta (' + robotsTags.length + ') — search engines may read them as conflicting');
  } else if (page.key === 'notfound') {
    if (!/noindex/i.test(robotsTags[0])) fail('the 404 page must carry a noindex robots directive');
  } else if (/noindex/i.test(robotsTags[0])) {
    fail('a live page is marked noindex: ' + robotsTags[0]);
  }

  /* Headings --------------------------------------------------------- */
  const h1s = matchAll(html, /<h1[^>]*>/gi);
  if (h1s.length !== 1) fail('expected exactly one <h1>, found ' + h1s.length);

  /* Images ----------------------------------------------------------- */
  const imgs = matchAll(html, /<img\b[^>]*>/gi);
  let imgIssues = 0;
  for (const match of imgs) {
    const img = match[0];
    const src = attr(img, 'src');
    if (!src) {
      fail('an <img> has no src');
      imgIssues += 1;
      continue;
    }
    if (!/^https?:\/\//.test(src)) {
      const target = path.join(ROOT, src.replace(/^\//, ''));
      if (!fs.existsSync(target)) {
        fail('image not found: ' + src);
        imgIssues += 1;
      }
    }
    if (attr(img, 'alt') === null) {
      fail('image without alt attribute: ' + src);
      imgIssues += 1;
    } else if (attr(img, 'alt').trim() === '') {
      warn('image with empty alt: ' + src);
    }
    if (attr(img, 'width') === null || attr(img, 'height') === null) {
      warn('image without width/height (may shift layout): ' + src);
    }
  }
  if (imgIssues === 0) ok(imgs.length + ' images checked');

  /* Internal links --------------------------------------------------- */
  const links = matchAll(html, /<a\b[^>]*href="([^"]*)"[^>]*>/gi);
  let linkIssues = 0;
  for (const match of links) {
    const href = match[1];
    if (/^(https?:|mailto:|tel:|javascript:|#)/i.test(href)) {
      /* A link that points at "#" is a dead placeholder: it jumps to the top
         of the page and announces a destination it does not have. */
      if (href === '#') {
        fail('dead placeholder link (href="#"): ' + match[0].slice(0, 90));
        linkIssues += 1;
      }
      continue;
    }
    if (!href.startsWith('/')) {
      warn('relative link (breaks on nested pages): ' + href);
      linkIssues += 1;
      continue;
    }
    const target = routeToFile(href);
    if (!target) {
      fail('broken internal link: ' + href);
      linkIssues += 1;
    }
  }
  if (linkIssues === 0) ok(links.length + ' links resolved');

  /* Config placeholders ---------------------------------------------- */
  for (const match of matchAll(html, /data-bp="([^"]*)"/gi)) {
    const key = match[1];
    const property = BP_KEYS[key];
    if (!property) {
      fail('data-bp="' + key + '" does not match any key in assets/js/config.js');
    } else if (BP_CONFIG[property] === undefined) {
      fail('data-bp="' + key + '" maps to a missing config property: ' + property);
    }
  }
  for (const match of matchAll(html, /data-bp-social="([^"]*)"/gi)) {
    const key = match[1];
    if (!BP_CONFIG.social || BP_CONFIG.social[key] === undefined) {
      fail('data-bp-social="' + key + '" does not match any profile in assets/js/config.js');
    }
  }

  /* srcset sources ---------------------------------------------------- */
  const srcsets = matchAll(html, /srcset="([^"]*)"/gi);
  let srcsetIssues = 0;
  for (const match of srcsets) {
    for (const part of match[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (!url || /^https?:/.test(url)) continue;
      const target = path.join(ROOT, url.replace(/^\//, ''));
      if (!fs.existsSync(target)) {
        fail('srcset points at a missing file: ' + url);
        srcsetIssues += 1;
      }
    }
  }
  if (srcsetIssues === 0 && srcsets.length) ok(srcsets.length + ' srcset lists checked');

  /* Stylesheet + script references ------------------------------------ */
  const refs = matchAll(html, /(?:href|src)="(\/assets\/[^"]*)"/gi);
  for (const match of refs) {
    const target = path.join(ROOT, match[1].replace(/^\//, ''));
    if (!fs.existsSync(target)) fail('missing asset: ' + match[1]);
  }

  console.log('');
}

/* ------------------------------------------------------------------ */
/* Site-wide assets                                                    */
/* ------------------------------------------------------------------ */
console.log('Site files');
const required = [
  'robots.txt',
  'sitemap.xml',
  'site.webmanifest',
  'README.md',
  '.gitignore',
  'assets/css/styles.css',
  'assets/css/responsive.css',
  'assets/js/config.js',
  'assets/js/main.js',
  'assets/icons/favicon.svg',
  'assets/fonts/inter-latin-var.woff2',
  'assets/fonts/manrope-latin-var.woff2'
];
for (const rel of required) {
  if (fs.existsSync(path.join(ROOT, rel))) ok(rel);
  else fail('missing required file: ' + rel);
}

/* The global [hidden] rule has to exist and has to be !important.
   The browser hides [hidden] with a user-agent rule, but any author rule
   that sets `display` on the same element beats it — so a component with
   its own `display` would stay on screen while claiming to be hidden. */
const stylesCss = fs.readFileSync(path.join(ROOT, 'assets/css/styles.css'), 'utf8');
if (/\[hidden\]\s*\{[^}]*display:\s*none\s*!important/.test(stylesCss)) {
  ok('global [hidden] rule present');
} else {
  fail('styles.css is missing the global [hidden] { display: none !important } rule');
}

/* The desktop navigation dropdown is the one deliberate exception to that
   rule; if the override is removed the dropdown disappears on desktop. */
const responsiveCss = fs.readFileSync(path.join(ROOT, 'assets/css/responsive.css'), 'utf8');
if (/\.nav-submenu\[hidden\]\s*\{[^}]*display:\s*grid\s*!important/.test(responsiveCss)) {
  ok('desktop nav dropdown override present');
} else {
  fail('responsive.css is missing the .nav-submenu[hidden] { display: grid !important } override');
}

/* Nothing that would be stated to a customer as fact may ship with a
   made-up default. These are the details the business has to confirm, so
   they must be blank until somebody fills them in — a non-empty value here
   is printed on the page as if it were true. */
const MUST_BE_BLANK = [
  'email',
  'phone',
  'whatsapp',
  'address',
  'businessHours',
  'formEndpoint',
  'legalName'
];
const invented = MUST_BE_BLANK.filter((key) => {
  const v = BP_CONFIG[key];
  return v !== undefined && v !== null && String(v).trim() !== '';
});
if (invented.length) {
  fail('assets/js/config.js ships a default value for ' + invented.join(', ') +
    ' — leave it blank until the business confirms it');
} else {
  ok('no unconfirmed business detail ships with a default value');
}
if (BP_CONFIG.social) {
  const profiles = Object.keys(BP_CONFIG.social).filter(
    (k) => String(BP_CONFIG.social[k] || '').trim() !== ''
  );
  if (profiles.length) {
    fail('assets/js/config.js ships a default social profile for ' + profiles.join(', '));
  } else {
    ok('no unconfirmed social profile ships with a default value');
  }
}

console.log('');

/* ------------------------------------------------------------------ */
/* Summary                                                             */
/* ------------------------------------------------------------------ */
console.log('--------------------------------------------------');
console.log(errors === 0 ? 'PASS — no errors (' + warnings + ' warnings)' : 'FAIL — ' + errors + ' errors, ' + warnings + ' warnings');
console.log('--------------------------------------------------\n');

process.exit(errors === 0 ? 0 : 1);
