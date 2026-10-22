/**
 * build-site.js — Branding Peedika static site assembler
 * ---------------------------------------------------------------------------
 * The finished website in the site root is plain static HTML, CSS and JS and
 * can be deployed as-is. This script only exists so the shared header,
 * footer, <head> and structured data are maintained in one place instead of
 * being copied across thirteen pages.
 *
 *   node tools/build-site.js
 *
 * Source of truth:
 *   tools/partials/*.html  -> shared shells
 *   tools/pages/*.html     -> per-page body content
 *   tools/pages.js         -> per-page metadata (title, description, JSON-LD)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PARTIALS = path.join(__dirname, 'partials');
const PAGES_DIR = path.join(__dirname, 'pages');
const PAGES = require('./pages.js');

const SITE_URL = 'https://www.brandingpeedika.com';
const OG_IMAGE = `${SITE_URL}/assets/images/og-branding-peedika.png`;

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

/**
 * Replaces {{TOKEN}} placeholders.
 * {{current:key}} becomes ' aria-current="page"' when it matches the active
 * page key, otherwise an empty string.
 */
function fill(template, values) {
  return template.replace(/\{\{([\w:]+)\}\}/g, (match, key) => {
    if (key.startsWith('current:')) {
      const wanted = key.slice('current:'.length);
      return wanted === values.CURRENT ? ' aria-current="page"' : '';
    }
    return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match;
  });
}

/* --------------------------------------------------------------------- */
/* Responsive images                                                     */
/* --------------------------------------------------------------------- */
/**
 * Every photograph is generated at four widths in both AVIF and WebP by
 * tools/asset-pipeline.js. This step makes sure the markup always uses them:
 *
 *   - a raster <img> that is not inside a <picture> is wrapped in one, with
 *     an AVIF source, a WebP source and a responsive srcset on the <img>
 *     fallback;
 *   - the fallback <img> of an existing <picture> also gets a srcset, so the
 *     page stays responsive even where the <source> elements are ignored.
 *
 * SVG concept artwork is left alone — it is resolution independent and needs
 * no srcset.
 */
const IMAGE_DIR = path.join(ROOT, 'assets', 'images');

/** Default sizes for a standalone raster image. Override per image with a
 *  data-sizes="..." attribute in the page source. */
const DEFAULT_SIZES = '(min-width: 1024px) 30vw, (min-width: 560px) 46vw, 92vw';

function buildImageIndex() {
  const widths = new Map();
  if (!fs.existsSync(IMAGE_DIR)) return widths;
  fs.readdirSync(IMAGE_DIR).forEach((file) => {
    const match = /^(.+)-(\d+)\.(?:webp|avif)$/.exec(file);
    if (!match) return;
    const base = match[1];
    if (!widths.has(base)) widths.set(base, new Set());
    widths.get(base).add(Number(match[2]));
  });
  const index = new Map();
  widths.forEach((set, base) => {
    index.set(base, Array.from(set).sort((a, b) => a - b));
  });
  return index;
}

function srcsetFor(base, widths, ext) {
  return widths.map((w) => `/assets/images/${base}-${w}.${ext} ${w}w`).join(', ');
}

/** Returns the image base name for a raster photo, or null for anything else. */
function rasterBase(src) {
  const match = /^\/assets\/images\/(.+)-\d+\.webp$/.exec(src);
  return match ? match[1] : null;
}

/**
 * Rewrites the srcset of every <source> inside a <picture> so it always lists
 * every width that was generated for that photo. This keeps the <source> and
 * the <img> fallback in agreement and lets the browser reach the largest
 * variant on high-density screens.
 */
function expandSourceSrcsets(inner, index) {
  return inner.replace(/<source\b[^>]*>/g, (tag) => {
    const srcsetMatch = /\bsrcset="([^"]*)"/.exec(tag);
    if (!srcsetMatch) return tag;

    const first = srcsetMatch[1].split(',')[0].trim().split(/\s+/)[0];
    const baseMatch = /^\/assets\/images\/(.+?)-\d+\.(webp|avif)$/.exec(first);
    if (!baseMatch) return tag;

    const base = baseMatch[1];
    const ext = baseMatch[2];
    const widths = index.get(base);
    if (!widths || widths.length < 2) return tag;

    return tag.replace(srcsetMatch[0], `srcset="${srcsetFor(base, widths, ext)}"`);
  });
}

/** Adds srcset/sizes to the fallback <img> of an existing <picture>. */
function addFallbackSrcset(inner, index) {
  const imgMatch = /<img\b[^>]*>/.exec(inner);
  if (!imgMatch) return inner;

  const tag = imgMatch[0];
  if (/\bsrcset=/.test(tag)) return inner;

  const srcMatch = /\bsrc="([^"]+)"/.exec(tag);
  if (!srcMatch) return inner;

  const base = rasterBase(srcMatch[1]);
  if (!base) return inner;

  const widths = index.get(base);
  if (!widths || widths.length < 2) return inner;

  const sizesMatch = /<source\b[^>]*\bsizes="([^"]*)"/.exec(inner);
  const sizes = sizesMatch ? sizesMatch[1] : DEFAULT_SIZES;

  const newTag = tag.replace(
    /\ssrc="[^"]*"/,
    (m) => m + ` srcset="${srcsetFor(base, widths, 'webp')}" sizes="${sizes}"`
  );
  return inner.replace(tag, newTag);
}

/** Wraps a standalone raster <img> in a <picture> with AVIF + WebP sources. */
function wrapInPicture(tag, index) {
  const srcMatch = /\bsrc="([^"]+)"/.exec(tag);
  if (!srcMatch) return tag;

  const base = rasterBase(srcMatch[1]);
  if (!base) return tag;

  const widths = index.get(base);
  if (!widths || widths.length < 2) return tag;

  const dataSizes = /\bdata-sizes="([^"]*)"/.exec(tag);
  const sizes = dataSizes ? dataSizes[1] : DEFAULT_SIZES;

  let img = tag.replace(/\sdata-sizes="[^"]*"/, '');
  if (!/\bsrcset=/.test(img)) {
    img = img.replace(
      /\ssrc="[^"]*"/,
      (m) => m + ` srcset="${srcsetFor(base, widths, 'webp')}" sizes="${sizes}"`
    );
  }

  return (
    '<picture>' +
    `<source type="image/avif" srcset="${srcsetFor(base, widths, 'avif')}" sizes="${sizes}">` +
    `<source type="image/webp" srcset="${srcsetFor(base, widths, 'webp')}" sizes="${sizes}">` +
    img +
    '</picture>'
  );
}

function normalizeImages(html, index) {
  if (!index.size) return html;

  const blocks = [];

  // 1. Take the existing <picture> blocks aside and make their fallback
  //    <img> responsive too.
  html = html.replace(/<picture>[\s\S]*?<\/picture>/g, (block) => {
    const inner = block.replace(/^<picture>/, '').replace(/<\/picture>$/, '');
    const withSources = expandSourceSrcsets(inner, index);
    blocks.push('<picture>' + addFallbackSrcset(withSources, index) + '</picture>');
    return `<!--BP_PICTURE_${blocks.length - 1}-->`;
  });

  // 2. Wrap any remaining standalone raster <img> in a <picture>.
  html = html.replace(/<img\b[^>]*>/g, (tag) => wrapInPicture(tag, index));

  // 3. Put the <picture> blocks back.
  html = html.replace(/<!--BP_PICTURE_(\d+)-->/g, (match, i) => blocks[Number(i)]);

  return html;
}

/* --------------------------------------------------------------------- */
/* Structured data                                                       */
/* --------------------------------------------------------------------- */
function organizationLd() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Branding Peedika',
    url: `${SITE_URL}/`,
    slogan: 'Where Every Brand Begins.',
    description:
      'Branding and digital marketing studio for small businesses in Kerala — brand identity, social media, content creation, websites and practical digital marketing.',
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/icons/icon-512.png`, width: 512, height: 512 },
    areaServed: { '@type': 'State', name: 'Kerala', country: 'IN' },
    knowsAbout: [
      'Brand identity design',
      'Logo design',
      'Social media marketing',
      'Content creation',
      'Website development',
      'Search engine optimization',
      'Local SEO'
    ]
  };
}

function websiteLd() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: 'Branding Peedika',
    description: 'Where Every Brand Begins.',
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE_URL}/#organization` }
  };
}

function webPageLd(page) {
  return {
    '@type': page.webPageType || 'WebPage',
    '@id': `${SITE_URL}${page.url}#webpage`,
    name: page.title,
    description: page.description,
    url: `${SITE_URL}${page.url}`,
    inLanguage: 'en-IN',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` }
  };
}

function breadcrumbLd(page) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${SITE_URL}${page.url}#breadcrumb`,
    itemListElement: page.breadcrumbs.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`
    }))
  };
}

/* One Service node per offering. The @id is derived from the URL the
   offering lives at, so the same service carries the same @id on the
   /services/ hub and on its own detail page. */
function serviceLd(service) {
  return {
    '@type': 'Service',
    '@id': `${SITE_URL}${service.id || service.url + '#service'}`,
    name: service.name,
    description: service.description,
    url: `${SITE_URL}${service.url}`,
    serviceType: service.serviceType,
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: { '@type': 'State', name: 'Kerala', country: 'IN' },
    audience: { '@type': 'Audience', audienceType: 'Small business owners in Kerala' }
  };
}

/* The articles live as sections of /blog/, so each one is addressed by the
   page URL plus its anchor. */
function blogPostUrl(post) {
  return `${SITE_URL}/blog/#${post.id}`;
}

function blogPostLd(post) {
  const url = blogPostUrl(post);
  return {
    '@type': 'BlogPosting',
    '@id': url,
    headline: post.headline,
    description: post.description,
    url,
    datePublished: post.datePublished,
    dateModified: post.datePublished,
    inLanguage: 'en-IN',
    isPartOf: { '@id': `${SITE_URL}/blog/#webpage` },
    mainEntityOfPage: { '@id': `${SITE_URL}/blog/#webpage` },
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` }
  };
}

/**
 * Every page carries the same four kinds of node:
 *   Organization  — who the business is (referenced by every other node)
 *   WebSite       — the site itself
 *   WebPage       — this particular page (Blog / AboutPage / CollectionPage / …)
 *   plus BreadcrumbList on inner pages and Service on the service pages
 * and the /blog/ page additionally carries a BlogPosting per article.
 */
function buildJsonLd(page) {
  const graph = [organizationLd(), websiteLd()];

  const pageNode = webPageLd(page);
  /* the article nodes are referenced by id and listed at the top of the graph */
  if (page.posts) pageNode.blogPost = page.posts.map((p) => ({ '@id': blogPostUrl(p) }));
  graph.push(pageNode);

  if (page.breadcrumbs) graph.push(breadcrumbLd(page));
  if (page.service) graph.push(serviceLd(page.service));
  if (page.services) page.services.forEach((s) => graph.push(serviceLd(s)));
  if (page.posts) page.posts.forEach((p) => graph.push(blogPostLd(p)));

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
}

/* --------------------------------------------------------------------- */
/* Build                                                                 */
/* --------------------------------------------------------------------- */
function build() {
  const head = read(path.join(PARTIALS, 'head.html'));
  const header = read(path.join(PARTIALS, 'header.html'));
  const footer = read(path.join(PARTIALS, 'footer.html'));
  const imageIndex = buildImageIndex();

  PAGES.forEach((page) => {
    const bodyFile = path.join(PAGES_DIR, `${page.key}.html`);
    if (!fs.existsSync(bodyFile)) {
      console.warn('! missing content file: ' + path.relative(ROOT, bodyFile));
      return;
    }
    const body = read(bodyFile);

    const values = {
      TITLE: page.title,
      DESCRIPTION: page.description,
      CANONICAL: `${SITE_URL}${page.url}`,
      OG_TYPE: page.ogType || 'website',
      OG_TITLE: page.ogTitle || page.title,
      OG_DESCRIPTION: page.ogDescription || page.description,
      OG_IMAGE: page.ogImage || OG_IMAGE,
      OG_URL: `${SITE_URL}${page.url}`,
      EXTRA_HEAD: page.extraHead || '',
      ROBOTS: page.robots || 'index, follow, max-image-preview:large',
      JSONLD: buildJsonLd(page),
      CURRENT: page.key
    };

    let html = fill(head, values);
    html = html.replace('<!--HEADER-->', fill(header, values));
    html = html.replace('<!--CONTENT-->', body);
    html = html.replace('<!--FOOTER-->', fill(footer, values));

    html = normalizeImages(html, imageIndex);

    const outFile = path.join(ROOT, page.file);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, html, 'utf8');
    console.log('built  ' + page.file);
  });
}

build();
