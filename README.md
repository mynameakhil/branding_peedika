# Branding Peedika — Website

> **Where Every Brand Begins.**
> A static, production-ready marketing website for **Branding Peedika**, a branding and digital
> marketing studio for small businesses in Kerala.

Built with semantic HTML5, modern CSS3 and vanilla ES6+ JavaScript. **No frameworks, no runtime
dependencies, no build step required to deploy.**

---

## Table of contents

1. [What is in the box](#1-what-is-in-the-box)
2. [Quick start — run it locally](#2-quick-start--run-it-locally)
3. [Configuration — the one file to edit](#3-configuration--the-one-file-to-edit)
4. [Connecting the enquiry form](#4-connecting-the-enquiry-form)
5. [Project structure](#5-project-structure)
6. [The optional build script](#6-the-optional-build-script)
7. [Placeholders and the "no invented facts" rule](#7-placeholders-and-the-no-invented-facts-rule)
8. [SEO](#8-seo)
9. [Accessibility](#9-accessibility)
10. [Performance](#10-performance)
11. [Testing checklist](#11-testing-checklist)
12. [Deployment](#12-deployment)
13. [Image and font attribution](#13-image-and-font-attribution)
14. [Browser support](#14-browser-support)
15. [Things to do before launch](#15-things-to-do-before-launch)

---

## 1. What is in the box

Thirteen pages, all hand-written, all static:

| Path | File | Purpose |
| --- | --- | --- |
| `/` | `index.html` | Homepage — hero, trust, about, services, process, why-us, portfolio, Kerala focus, FAQ, CTA |
| `/about/` | `about/index.html` | Story, principles, who we work with, process |
| `/services/` | `services/index.html` | All six services, where to start, how engagements work |
| `/services/branding-logo-design/` | `services/branding-logo-design/index.html` | Branding & logo design service page |
| `/services/social-media-marketing/` | `services/social-media-marketing/index.html` | Social media marketing service page |
| `/services/content-creation/` | `services/content-creation/index.html` | Content creation service page |
| `/services/website-development/` | `services/website-development/index.html` | Website development service page |
| `/services/digital-marketing/` | `services/digital-marketing/index.html` | Digital marketing service page (incl. `#local-presence`) |
| `/portfolio/` | `portfolio/index.html` | Six clearly-labelled sample concepts |
| `/blog/` | `blog/index.html` | Article index plus five full articles on the page |
| `/contact/` | `contact/index.html` | Enquiry form, contact routes, what-happens-next |
| `/privacy-policy/` | `privacy-policy/index.html` | Privacy policy with a table of contents |
| `/404.html` | `404.html` | Custom not-found page (marked `noindex`) |

Plus `robots.txt`, `sitemap.xml`, `site.webmanifest`, `README.md` and `.gitignore`.

**Important:** every internal link and asset path is **root-relative** (`/assets/...`). The site
must therefore be served from the **root of a domain** (e.g. `https://www.brandingpeedika.com/`),
not from a sub-folder such as `example.com/website/`. See [Deployment](#12-deployment).

---

## 2. Quick start — run it locally

You have two options. Option A is all you need to view the site; Option B is for editing.

### Option A — just view the site (no install)

The site is plain files. Any static server works:

```bash
# the bundled dev server — zero dependencies, no npx, no install
cd Website
node tools/serve.js -p 8080

# or Python (works on macOS and Linux out of the box)
python3 -m http.server 8080

# or Node, with no install
npx --yes serve . -l 8080
```

Then open <http://localhost:8080>.

`tools/serve.js` is a small server that understands this site's conventions: it serves
`/services/` from `services/index.html`, returns `404.html` with a real **HTTP 404** status for
unknown paths, sends the right `Content-Type` for `.woff2`, `.avif`, `.webp` and `.webmanifest`,
compresses text responses with Brotli or gzip the way a production host does, and answers
conditional requests with `304`. Any other static server works just as well — this one is only
a convenience.

> **Do not open `index.html` by double-clicking it.** The `file://` protocol blocks the
> `fetch`/module-free scripts and breaks the root-relative paths, so you will see a broken page.

### Option B — work on the site

```bash
cd Website

# 1. Install the optional tooling
#    (sharp for the image pipeline, puppeteer-core + axe-core for the browser audit)
cd tools
npm install
cd ..

# 2. Start a local server
node tools/serve.js -p 8080
```

### The editing workflow

The **root HTML files are generated output**. Edit the sources in `tools/`, then rebuild:

```bash
node tools/build-site.js     # regenerate all 13 pages from the partials + page bodies
node tools/validate.js       # check links, images, titles, descriptions, alt text, headings
node tools/audit.js          # drive a real browser: layout, axe-core, contact contract, no-JS
```

`validate.js` and `audit.js` both exit with code `1` if anything is broken, so they work in CI
as-is. `audit.js` needs the dev server running and a local Chrome (see
[Testing](#11-testing-checklist)).

---

## 3. Configuration — the one file to edit

Everything that can change about the business lives in **one file**:

```
assets/js/config.js
```

Open it and fill in every value marked `REPLACE`:

```js
window.BP_CONFIG = {
  businessName: 'Branding Peedika',
  legalName: '',        // REPLACE: registered entity name, if different
  tagline: 'Where Every Brand Begins.',
  description: '...',

  siteUrl: 'https://www.brandingpeedika.com',   // REPLACE with the live domain

  email: '',            // REPLACE: e.g. hello@brandingpeedika.com
  phone: '',            // REPLACE: e.g. +91 98765 43210
  whatsapp: '',         // REPLACE: e.g. '+91 98765 43210' — shown as written, linked as wa.me/<digits>
  address: '',          // REPLACE: business address, if there is a public one
  businessHours: '',    // REPLACE: e.g. 'Monday to Saturday, 10:00 AM – 6:00 PM IST'

  social: { instagram: '', facebook: '', linkedin: '', youtube: '', twitter: '' },

  formEndpoint: '',     // REPLACE — see section 4
  formEndpointType: 'json',

  region: 'Kerala, India',
  serviceArea: 'Kerala, India',
  location: { addressLocality: '', addressRegion: 'Kerala', addressCountry: 'IN' }
};
```

Every business detail that would be shown to a customer as fact — email, phone, WhatsApp,
address, opening hours, the social profiles, the form endpoint — ships **blank**. While a
value is blank the page shows a clearly-labelled placeholder instead of a guess, and
`validate.js` fails the build if any of them is given an invented default.

The page uses these values automatically:

* `data-bp="email" | "phone" | "whatsapp" | "address" | "hours"` elements are filled in at
  runtime. On a link the visible text *and* the `href` are written together, so the link always
  reads as the address it opens — `mailto:`, `tel:` and `wa.me` respectively.
* `data-bp-social="instagram"` (and friends) stay **hidden** until a URL is supplied, and the
  whole row of icons is hidden with them, so the footer never shows a dead social icon.
* Until a value is filled in, the element is **not a link at all** — it has no `href`, so there
  is nothing to click and nothing misleading to announce.
* `data-bp-year` is replaced with the current year.
* `data-bp-whatsapp-cta` elements stay hidden until a WhatsApp number exists.

### Other places the domain appears

The domain is also hard-coded in these files, because they are static:

| File | What to change |
| --- | --- |
| `tools/pages.js` | `SITE_URL` is in `tools/build-site.js`; page URLs are relative |
| `tools/build-site.js` | `const SITE_URL = 'https://www.brandingpeedika.com'` — used for canonicals, OG URLs and JSON-LD |
| `sitemap.xml` | Replace `https://www.brandingpeedika.com` |
| `robots.txt` | Replace the `Sitemap:` line |
| `assets/js/config.js` | `siteUrl` |

Run `node tools/build-site.js` after changing `SITE_URL` so the canonicals and JSON-LD pick it up.

---

## 4. Connecting the enquiry form

**The form does not work out of the box, by design.** A static site has no server to deliver mail
to. Rather than showing a fake "Thanks, we'll be in touch" message, the site shows an honest
notice:

> *Enquiry form not connected yet. This site is a static build, so the form has no server to
> deliver to. Add a form endpoint in `assets/js/config.js` to activate it…*

To activate it, point `formEndpoint` at a service that accepts POST requests:

```js
formEndpoint: 'https://formspree.io/f/xxxxxxxx',
formEndpointType: 'json',   // or 'formdata'
```

**Supported services** (any endpoint that accepts a POST and answers `2xx` on success):

* [Formspree](https://formspree.io)
* [Web3Forms](https://web3forms.com)
* [Basin](https://usebasin.com)
* [Getform](https://getform.io)
* A Cloudflare Worker or your own small API

The script in `assets/js/main.js` sends JSON by default and falls back to `FormData` if the
endpoint rejects the JSON body.

**If you would rather not use a third-party service**, point `formEndpoint` at a `mailto:`-style
handler of your own, or remove the form and leave only the direct email address.

**What the form collects:** name, business name, email, phone/WhatsApp (optional), service of
interest, message, and a consent checkbox. Nothing is stored in the browser, and no third-party
analytics or advertising trackers are present.

---

## 5. Project structure

```
Website/
├── index.html                     # generated — homepage
├── about/index.html               # generated
├── services/
│   ├── index.html                 # generated
│   ├── branding-logo-design/index.html
│   ├── social-media-marketing/index.html
│   ├── content-creation/index.html
│   ├── website-development/index.html
│   └── digital-marketing/index.html
├── portfolio/index.html           # generated
├── blog/index.html                # generated
├── contact/index.html             # generated
├── privacy-policy/index.html      # generated
├── 404.html                       # generated
├── robots.txt
├── sitemap.xml
├── site.webmanifest
├── README.md
├── .gitignore
│
├── assets/                        # the deployable static site
│   ├── css/
│   │   ├── styles.css             # tokens, reset, typography, layout, components
│   │   └── responsive.css         # breakpoints 560 / 768 / 1024 / 1280
│   ├── js/
│   │   ├── config.js              # ← the one file you edit
│   │   └── main.js                # all behaviour, no dependencies
│   ├── fonts/
│   │   ├── inter-latin-var.woff2
│   │   └── manrope-latin-var.woff2
│   ├── icons/
│   │   ├── favicon.svg, favicon-16.png, favicon-32.png
│   │   ├── apple-touch-icon.png, icon-192.png, icon-512.png
│   └── images/
│       ├── *.webp / *.avif        # 13 photographs, 2–4 widths each
│       ├── concept-*.svg          # 6 original sample concept mock-ups
│       └── og-branding-peedika.png
│
└── tools/                         # OPTIONAL — not deployed, not required at runtime
    ├── build-site.js              # assembles the 13 pages
    ├── pages.js                   # per-page title / description / canonical / JSON-LD
    ├── validate.js                # link, asset and metadata checks
    ├── audit.js                   # browser audit: geometry, axe-core, contact contract, no-JS
    ├── serve.js                   # zero-dependency local dev server
    ├── partials/                  # head.html, header.html, footer.html
    ├── pages/                     # one body fragment per page
    ├── asset-pipeline.js          # fetch → resize → WebP/AVIF (needs `sharp`)
    ├── make-icons.js, make-og.js  # icon and OG image generation
    ├── preview.js, sheet.js       # image review: thumbnails + contact sheet
    ├── sources.json               # image manifest
    ├── sources.resolved.json      # resolved licence/author metadata
    └── package.json
```

> **Note on the legacy `assests/` folder.** The original project contained an empty directory
> named `assests` (misspelled). It contained no files and has been removed. The real folder is
> `assets/`.

### What to deploy

Deploy **the whole `Website/` folder except `tools/`**. The `tools/` directory is a development
convenience and is not needed to serve the site.

---

## 6. The optional build script

`tools/build-site.js` exists so the shared header, footer, `<head>` and structured data live in one
place rather than being copy-pasted across thirteen pages. **The output is plain static HTML** —
you can hand-edit the generated files, but the next build will overwrite them, so edit the
sources instead.

```
tools/partials/head.html     → <head>, skip link, <main> wrapper
tools/partials/header.html   → site header and navigation ({{current:key}} markers)
tools/partials/footer.html   → site footer (data-bp-* hooks)
tools/pages/<key>.html       → the body of one page
tools/pages.js               → title, description, canonical path, breadcrumbs, Service metadata
```

### Tokens

| Token | Replaced with |
| --- | --- |
| `{{TITLE}}`, `{{DESCRIPTION}}`, `{{CANONICAL}}` | from `tools/pages.js` |
| `{{OG_TYPE}}`, `{{OG_TITLE}}`, `{{OG_DESCRIPTION}}`, `{{OG_IMAGE}}`, `{{OG_URL}}` | Open Graph / Twitter tags |
| `{{EXTRA_HEAD}}` | page-specific `<head>` extras |
| `{{ROBOTS}}` | the `robots` meta directive — `index, follow, max-image-preview:large` everywhere, `noindex, follow` on the 404 page (set with `robots:` in `tools/pages.js`) |
| `{{JSONLD}}` | the generated JSON-LD graph |
| `{{current:home}}` | ` aria-current="page"` when the key matches the page being built, otherwise empty |

### Structured data generated

Every page carries one `@graph` with a single `@context`. The node `@id`s are stable
across pages, so the same service is the same node wherever it is mentioned.

| Node | Where |
| --- | --- |
| `Organization` | every page — it is the entity every other node points at |
| `WebSite` | every page |
| `WebPage` | every page; the type is specialised per page (`AboutPage`, `CollectionPage`, `ContactPage`, `Blog`) |
| `BreadcrumbList` | every page except the home page — it matches the visible breadcrumb trail |
| `Service` | the five service detail pages (one each) and the `/services/` hub (all six offerings) |
| `BlogPosting` | `/blog/` — one per article, addressed by the page URL plus the article anchor |

The service list is declared once in `tools/pages.js` (`SERVICES`) and reused by the
detail pages and the hub, so the structured data can never drift from the page copy.
Changing a service name or description is a one-line edit there.

### Commands

```bash
node tools/build-site.js     # regenerate the 13 pages
node tools/validate.js       # lint links, images, metadata, alt text, headings
node tools/serve.js -p 8080  # local dev server (no dependencies)
```

### Responsive images are normalised at build time

Every photograph is generated at four widths in both AVIF and WebP by `tools/asset-pipeline.js`.
The build step then guarantees the markup uses them, so no page can ship a single-size image by
accident:

* a raster `<img>` that is not already inside a `<picture>` is wrapped in one, with an
  `image/avif` and an `image/webp` `<source>`;
* the `<img>` fallback gets a `srcset` plus a `sizes` attribute;
* any `<source>` whose `srcset` lists only one file is expanded to the full width list;
* the `sizes` attribute defaults to `(min-width: 1024px) 30vw, (min-width: 560px) 46vw, 92vw`.

To override the `sizes` for one image, put `data-sizes="…"` on the `<img>` in the page source.
The attribute is removed from the output:

```html
<img src="/assets/images/kerala-village-tea-shop-960.webp"
     data-sizes="(min-width: 768px) 50vw, 100vw"
     alt="…">
```

The image pipeline is optional and only needed if you replace photographs:

```bash
cd tools
npm install                   # installs sharp
node asset-pipeline.js fetch  # download originals into tools/source/
node asset-pipeline.js build  # resize + encode to WebP and AVIF
node make-icons.js            # regenerate favicons and PWA icons
node make-og.js               # regenerate the Open Graph image
```

---

## 7. Placeholders and the "no invented facts" rule

This site was built without access to real business data, and **nothing has been invented to fill
the gaps.** Specifically:

* No testimonials, review counts, star ratings, client names, client logos or case-study numbers.
* No pricing, packages, discounts or "from ₹X" figures.
* No phone number, email address, street address or map coordinates.
* No team member names or portraits.
* No awards, certifications or years-in-business claims.

Where such information would normally go, the site says so plainly. The portfolio page presents
**six original sample concepts** with fictional brand names, each carrying a visible
"Sample concept — not client work" band, and the page opens with an explicit disclaimer.

**Your first job after taking over the site** is to replace these with real material:

| Replace | Where |
| --- | --- |
| Business name, email, phone, WhatsApp, address, hours | `assets/js/config.js` |
| Social profile URLs | `assets/js/config.js` |
| Form endpoint | `assets/js/config.js` |
| Domain | `assets/js/config.js`, `tools/build-site.js`, `sitemap.xml`, `robots.txt` |
| Logo mark (currently a text wordmark) | `assets/icons/` + `tools/partials/header.html` + `tools/partials/footer.html` |
| Sample concepts with real projects | `assets/images/concept-*.svg` and `tools/pages/portfolio.html` |
| Blog articles | `tools/pages/blog.html` |
| Photography | `assets/images/` |

---

## 8. SEO

* Unique `<title>` and meta description on every page (all verified unique by `validate.js`).
* `<link rel="canonical">` on every page, pointing at the configured domain.
* Open Graph and Twitter Card tags on every page, with a 1200×630 share image.
* `lang="en-IN"` on `<html>`, `og:locale` set to `en_IN`.
* JSON-LD: `Organization`, `WebSite`, `WebPage`, `BreadcrumbList`, `Service` and `BlogPosting` — see [Structured data generated](#structured-data-generated).
* Visible breadcrumbs on every inner page, matching the `BreadcrumbList` data.
* `robots.txt` and `sitemap.xml` at the root; the 404 page is `noindex, follow`.
* One `<h1>` per page, with a sensible heading order below it.
* Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`.
* Descriptive, unique `alt` text on every image.
* Internal linking: every service page links to the others, and every page links to `/contact/`.

**After launch:** submit `https://www.brandingpeedika.com/sitemap.xml` in Google Search Console and
Bing Webmaster Tools, and create a Google Business Profile — for a local business it usually
delivers more enquiries than anything else on this list.

---

## 9. Accessibility

The site targets **WCAG 2.2 AA**.

* A "Skip to main content" link is the first focusable element on every page.
* Every interactive element has a visible `:focus-visible` outline (3px gold, 3px offset).
* The mobile menu is a real `<button>` with `aria-expanded` and `aria-controls`; `Escape` closes
  it and returns focus to the toggle.
* The FAQ accordion uses `aria-expanded`, `aria-controls` and labelled `role="region"` panels.
  Panels are `hidden` in the markup, so the content is genuinely collapsed without JavaScript.
* The enquiry form has real `<label>` elements, `autocomplete` attributes, inline error messages
  with `role="alert"`, and `aria-invalid` on the offending field. The first invalid field
  receives focus on submit.
* Colour contrast: body text is `#202A36` on `#FFFFFF` and `#142B4A` on white/ivory surfaces.
  The brand gold `#F2B544` is **decorative only** — as text it fails contrast, so gold-coloured
  *text* uses the `--gold-text` token (`#8A5F14`, the same 38° hue darkened until it clears
  WCAG AA 4.5:1 on white, ivory and the light surface colour). The footer and the muted labels
  were raised to 0.55 alpha over the navy footer for the same reason.
* **Target sizes clear 24 × 24 CSS px.** The consent checkbox on the contact form is a real
  24 × 24 control rather than the browser's default 13 px, so it satisfies WCAG 2.2 SC 2.5.8
  (Target Size, Minimum) without relying on the inline or spacing exceptions. Every other
  interactive element — buttons, nav links, footer links, form fields — is larger still.
* `prefers-reduced-motion: reduce` disables the scroll-reveal transitions, smooth scrolling and
  hover transforms.
* All content is present in the initial HTML response. JavaScript only *adds* behaviour — the
  site is fully readable with scripting disabled. The scroll-reveal animation is the one
  feature that needs a script to undo itself, so the page head sets a `js` class on
  `<html>` and the hidden state is only ever applied to `.js [data-reveal]`. A visitor without
  JavaScript gets every block in its final state, and if the reveal script itself fails to
  run, a two-second safety net in the same inline snippet reveals everything anyway.
* **Unconfigured contact details are not links.** An email, phone or WhatsApp address that has
  not been filled in yet renders as a clearly-marked placeholder, and the `<a>` element has no
  `href` at all — a dead `href="#"` would be announced as a link with a destination it does not
  have, and would jump to the top of the page when clicked. Once the value *is* configured, the
  link text and the `href` are written together, so the visible text always matches the
  destination. The same applies to the social icons and the "Copy email address" button: they
  are hidden until there is something to point at.
* **The `hidden` attribute is always honoured.** The browser hides `[hidden]` elements with a
  user-agent rule, but any author rule that sets `display` on the same element is stronger than
  it — so a component with its own `display` would stay on screen while claiming to be hidden.
  `styles.css` therefore ends with a global `[hidden] { display: none !important; }`. The one
  deliberate exception is the desktop navigation dropdown, which stays in the layout so it can
  open on hover; it overrides the rule in `responsive.css`. `validate.js` fails the build if
  either of those two rules goes missing.

**Recommended manual checks** (see [Testing](#11-testing-checklist)):

* Navigate every page using only the keyboard.
* Run [axe DevTools](https://www.deque.com/axe/devtools/) or Lighthouse's accessibility audit.
* Test with a screen reader (NVDA on Windows, VoiceOver on macOS/iOS).
* Zoom to 200% and check that nothing is clipped or overlapping.

---

## 10. Performance

Targets (not claims — measure your own build):

| Metric | Target | Measured here |
| --- | --- | --- |
| Lighthouse Performance (mobile) | 95+ | 97–100, average 99 |
| Lighthouse Accessibility / Best Practices | 95+ | 100 on every page |
| Lighthouse SEO | 95+ | 100 on every page except `404.html` (see below) |
| Largest Contentful Paint | < 2.5 s on 4G | 1.7–2.2 s |
| Cumulative Layout Shift | < 0.1 | 0 |
| Interaction to Next Paint | < 200 ms | no long task over 50 ms in the script |
| Total page weight (homepage) | < 400 KB | 193 KB compressed (Lighthouse, first view) / 353 KB for the whole page including the lazy images (mobile, DPR 2.625) |

### Measured on this build

**Lighthouse 13, mobile emulation** (Moto G Power profile, simulated slow 4G, 4× CPU throttle),
run against the bundled dev server, which compresses with Brotli exactly like the hosts the
deployment section recommends:

| Page | Perf | A11y | Best practices | SEO | LCP | TBT | CLS | Page weight |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 97 | 100 | 100 | 100 | 2.2 s | 20 ms | 0 | 193 KB |
| `/about/` | 100 | 100 | 100 | 100 | 1.7 s | 0 ms | 0 | 125 KB |
| `/services/` | 100 | 100 | 100 | 100 | 1.7 s | 0 ms | 0 | 98 KB |
| `/services/branding-logo-design/` | 98 | 100 | 100 | 100 | 1.7 s | 100 ms | 0 | 99 KB |
| `/services/social-media-marketing/` | 98 | 100 | 100 | 100 | 1.7 s | 0 ms | 0 | 132 KB |
| `/services/content-creation/` | 99 | 100 | 100 | 100 | 1.7 s | 90 ms | 0 | 98 KB |
| `/services/website-development/` | 100 | 100 | 100 | 100 | 1.8 s | 0 ms | 0 | 122 KB |
| `/services/digital-marketing/` | 100 | 100 | 100 | 100 | 1.7 s | 0 ms | 0 | 99 KB |
| `/portfolio/` | 99 | 100 | 100 | 100 | 1.7 s | 130 ms | 0 | 107 KB |
| `/blog/` | 99 | 100 | 100 | 100 | 2.1 s | 0 ms | 0 | 289 KB |
| `/contact/` | 98 | 100 | 100 | 100 | 1.7 s | 160 ms | 0 | 98 KB |
| `/privacy-policy/` | 100 | 100 | 100 | 100 | 1.7 s | 0 ms | 0 | 98 KB |
| `404.html` | 100 | 100 | 100 | 66 | 1.7 s | 0 ms | 0 | 96 KB |

**Averages across the 13 pages: Performance 99, Accessibility 100, Best Practices 100, SEO 97.**
The SEO average is pulled down only by the 404 page's deliberate `noindex` (below).

**Whole-page transfer weight.** The Lighthouse column above is the weight of the *first* view.
Scrolling the page pulls in the lazy-loaded images as well, so the full page costs more.
Measured cold (cache disabled), through the Brotli-compressing dev server, with the browser's
own network log:

| Page | Desktop 1440×900 @1× | Mobile 412×823 @2.625× |
| --- | --- | --- |
| `/` | 21 requests · 227 KB | 20 requests · 353 KB |
| `/services/` | 11 · 126 KB | 11 · 142 KB |
| `/blog/` | 14 · 195 KB | 14 · 410 KB |
| `/portfolio/` | 17 · 128 KB | 17 · 140 KB |
| `/contact/` | 10 · 98 KB | 10 · 98 KB |

The heaviest page is `/blog/` on a 2.6× phone, because it carries five photographs. Everything
stays under the 400 KB budget. Most of the weight is the two self-hosted variable fonts
(73 KB) — they are cached across pages, so only the first page load pays for them.

> **The 404 page's SEO score of 66 is intentional.** Its only failing audit is
> "Page is blocked from indexing", which is exactly what the `noindex` directive on the 404
> page is supposed to do — a not-found page must never appear in search results. Every other
> SEO audit passes. Do not "fix" it.

The remaining Total Blocking Time on the longer pages is the browser's **first layout** of the
page, not a script problem: the script itself now finishes in well under 20 ms on every page.

**Core Web Vitals, cold load, 1440×900, over the same server** (no throttling, cache disabled):

| Page | LCP | CLS | FCP |
| --- | --- | --- | --- |
| `/` | 184 ms | 0.0000 | 184 ms |
| `/about/` | 252 ms | 0.0000 | 252 ms |
| `/services/` | 124 ms | 0.0000 | 124 ms |
| `/services/branding-logo-design/` | 136 ms | 0.0000 | 136 ms |
| `/services/social-media-marketing/` | 132 ms | 0.0000 | 132 ms |
| `/services/content-creation/` | 140 ms | 0.0000 | 140 ms |
| `/services/website-development/` | 152 ms | 0.0000 | 152 ms |
| `/services/digital-marketing/` | 148 ms | 0.0000 | 148 ms |
| `/portfolio/` | 128 ms | 0.0000 | 128 ms |
| `/blog/` | 180 ms | 0.0000 | 180 ms |
| `/contact/` | 452 ms | 0.0000 | 452 ms |
| `/privacy-policy/` | 144 ms | 0.0000 | 144 ms |
| `404.html` | 164 ms | 0.0000 | 164 ms |

Every page is under 300 KB for the first view and under 20 requests. The heaviest pages are
`/blog/` (five article images) and `/` (ten images); everything else ships well under 200 KB.
No page overflows horizontally at 390, 768, 1280 or 1600 px wide.
Re-measure with `node tools/serve.js` running and Chrome's Lighthouse panel.

**Layout shift under a slow font.** The numbers above are for a normal load. The worst case is a
first visit on a slow connection, where the webfont arrives *after* the page has painted. With
the font delayed by 700 ms the site still scores **worst case CLS 0.0036, mean 0.0005** across
13 pages × 3 viewports (390 / 768 / 1440). Without the metric-matched fallbacks described below
the same test produced **worst case 0.0424, mean 0.0085** — still inside the "good" threshold,
but roughly ten times worse.

### How the build hits those numbers

* **No framework, no runtime dependency.** `main.js` is 21 KB of vanilla ES6+ (5.1 KB over the
  wire with Brotli) and `config.js` is 3.3 KB (1.1 KB with Brotli); the whole JavaScript payload
  for a page is two small files.
* **Self-hosted variable fonts** (Manrope + Inter, latin subset) with both files preloaded — no
  third-party font request, no render-blocking Google Fonts CSS.
* **Responsive images in AVIF and WebP** with `srcset`/`sizes`, plus explicit `width`/`height` on
  every `<img>` so nothing shifts while loading.
* **The hero image** is `fetchpriority="high"` and not lazy-loaded; everything below the fold is
  `loading="lazy" decoding="async"`.
* **CSS is split** into a core sheet and a responsive layer, both small, both cacheable.
* **No layout shift**: aspect-ratio boxes (`media--4x3` etc.) reserve space for every image, and
  the sticky header only changes shadow and border colour — never height.
* **The script never forces a layout.** Reading `window.scrollY` or starting an
  `IntersectionObserver` makes the browser lay the page out on the spot, and doing that inside
  the script task delays the first paint. Both are deferred to the next animation frame, so the
  browser paints first and the script settles afterwards. This is worth a lot: it took the
  Total Blocking Time from 570 ms to 0 ms and the Lighthouse Performance score from 77 to 95.

### The font-loading strategy (why there are nine extra `@font-face` rules)

The brand faces use `font-display: swap`, so the brand font is **always** applied — even on a
visitor's first, slow visit. `font-display: optional` was tried first because it guarantees a
zero-shift paint, but it silently keeps the page in the system font for the whole visit
whenever the download is not finished inside the 100 ms block period, which means the site
would often show a visitor's system font instead of the brand one. That is the wrong trade for
a branding studio's own website.

So the swap is kept, and the *fallback* is made metric-compatible instead. Section 1b of
`assets/css/styles.css` defines the system fonts that actually exist on each platform
(Segoe UI on Windows, Roboto on Android, Arial / Helvetica / Liberation Sans elsewhere), and
rescales them onto the brand metrics with the CSS Fonts 5 descriptors:

| Descriptor | What it does |
| --- | --- |
| `size-adjust` | scales glyph advances so the fallback breaks the copy into the same lines as the webfont |
| `ascent-override` | puts the fallback text on the same baseline |
| `descent-override` | keeps the line box the same height |

The numbers were measured, not guessed: every heading, lead paragraph and body paragraph on all
thirteen pages was rendered in the brand font and in each candidate fallback, and the scale was
fitted to the real text. The result is a worst-case width error of **0.84 %** for the display
faces and **0.47 %** for the body faces, which is what keeps the swap invisible.

The fallback families are per platform because one scale cannot fit more than one system font.
The font stack tries them in order and falls through to the plain system stack
(`Segoe UI, system-ui, -apple-system, sans-serif`) if none of them is installed. Browsers that do
not support `size-adjust` simply use the unadjusted system font — the site still works, it just
shifts a little more.

> If you change the typefaces, or the copy, re-fit these values. The method is: render every
> text block in the new font and in each candidate fallback, take the ratio of the total advance
> width, and use that ratio as `size-adjust`; divide the brand font's ascent and descent
> (measured from the font file) by the same ratio for the two override descriptors.

**After deploying**, turn on compression and long-lived caching at the host:

* `Cache-Control: public, max-age=31536000, immutable` for `/assets/**` (filenames contain no
  hash, so version the folder or use query strings if you need cache busting).
* `Cache-Control: public, max-age=3600` for HTML.
* Enable Brotli or Gzip for `.html`, `.css`, `.js`, `.svg` and `.xml`.
* Serve HTTP/2 or HTTP/3.

> **Compression is the single biggest performance lever on this site.** The stylesheet is 50 KB
> uncompressed and 8.4 KB with Brotli; the homepage is 193 KB compressed over the wire on the
> first view, 227 KB for the whole page on a desktop display.
> With compression off, the Lighthouse Performance score is 95; with it on, it is 99 — mainly
> because the render-blocking stylesheet finishes arriving sooner. Check it after deploying:
>
> ```bash
> curl -sI -H "Accept-Encoding: br" https://www.brandingpeedika.com/assets/css/styles.css | grep -i content-encoding
> ```

---

## 11. Testing checklist

Run through this before every launch.

**Automated**

```bash
node tools/build-site.js
node tools/validate.js
```

`validate.js` checks that every internal link and image resolves, that titles and descriptions are
present and unique, that every image has `alt` and dimensions, that each page has one `<h1>`, a
canonical, an OG image and a JSON-LD block, and that no `{{TOKEN}}` was left unrendered.

It also guards the things that are easy to break and invisible until someone clicks them:

| Check | Fails when |
| --- | --- |
| Dead placeholder links | an `<a>` still points at `#` |
| Config keys | a `data-bp` or `data-bp-social` attribute names something `assets/js/config.js` does not define |
| Invented details | `config.js` ships a non-empty default for the email, phone, WhatsApp, address, opening hours, form endpoint or a social profile — a guess that would be printed on the page as if it were true |
| Robots directive | a page has no `robots` meta, has more than one, is `noindex` while it is a live page, or is missing `noindex` on the 404 |
| Hidden elements | the global `[hidden] { display: none !important; }` rule is missing from `styles.css` |
| Desktop dropdown | the matching `.nav-submenu[hidden]` override is missing from `responsive.css` |

The config check reads `assets/js/config.js` directly, so it never drifts from the real file.

### The browser audit

`tools/audit.js` is the harness behind every accessibility and layout claim in this README.
It drives a real Chrome against the running dev server and performs four checks:

| # | Check | What it covers |
| --- | --- | --- |
| 1 | **Geometry** | 13 pages × 390 / 768 / 1280 / 1440 px: no horizontal overflow, no clipped text, no broken or zero-size images, no invisible text, no duplicate ids, no unlabelled form fields, no heading-level skips, exactly one `<h1>` per page, every image has `alt`, the `hidden` attribute always actually hides, and every interactive target is at least 24 × 24 CSS px (WCAG 2.2 SC 2.5.8) |
| 2 | **axe-core** | every page against the WCAG 2.0 / 2.1 / 2.2 A + AA and best-practice rulesets |
| 3 | **Contact contract** | with nothing configured the email / phone / WhatsApp entries carry no `href`, are not in the tab order and do not look clickable, and the social row and copy-email button stay hidden; with a config supplied they become real links whose visible text matches the destination |
| 4 | **No JavaScript** | the page is still fully readable with scripting disabled |

```bash
cd tools && npm install      # puppeteer-core + axe-core (optional dev tooling)
cd ..
node tools/serve.js -p 8080 # in one terminal
node tools/audit.js         # in another
```

It prints a PASS/FAIL summary and exits non-zero on any problem. Chrome is located
automatically; set `CHROME_PATH` if it is installed somewhere unusual. Current result:

```
[1/4] GEOMETRY - 13 pages x 4 viewports
  52 page/viewport combinations checked, 0 problem(s)
[2/4] AXE - WCAG 2.0/2.1/2.2 A + AA and best practices
  violations: critical 0, serious 0, moderate 0, minor 0
[3/4] CONTACTS - placeholder / hydration contract
  ok  unconfigured state - placeholders are plain text, not links
  ok  configured state - text and href are written together
[4/4] NO-JS - the content must still be visible
  ok  31 reveal blocks visible, 9517 characters of text
PASS
```

The browser is recycled every few pages rather than once per phase, so no single headless
Chrome ever has to hold 65+ rendered pages in memory, and a browser-level error (a renderer
falling over on a busy machine) is retried on a fresh tab. Such a failure is reported as
"the audit could not finish" — it is an environment problem, never a finding about the
site. Set `BP_AUDIT_DUMP=1` to pipe Chrome's own stderr to the console if you need to see
why the browser died. `BASE_URL` overrides the address the audit talks to.

**Manual**

- [ ] `node tools/build-site.js` runs with no warnings.
- [ ] `node tools/validate.js` reports `PASS`.
- [ ] Open the site at <http://localhost:8080> and click through all 13 pages.
- [ ] Check the browser console on every page — there should be no errors and no 404s.
- [ ] Resize to 360px, 768px, 1024px and 1440px wide. Nothing should overflow horizontally.
- [ ] Test the mobile menu: open, close with `Escape`, close by tapping a link.
- [ ] Test the FAQ accordion on the homepage.
- [ ] Submit the contact form with empty fields — errors must appear and focus must move to the
      first invalid field.
- [ ] Submit the contact form with a valid email — with no endpoint configured, it must show the
      "not connected" notice and **must not** claim success.
- [ ] Configure a real endpoint, then confirm a successful submission and a failure message.
- [ ] Tab through the whole page — focus must always be visible.
- [ ] Check the consent checkbox on the contact page is a comfortable 24 × 24 px target and that
      its label still toggles it.
- [ ] Look at the footer and the contact page: an email or phone that has not been configured
      yet must read as a placeholder and must **not** be a clickable link, and the row of social
      icons must be absent rather than four empty circles.
- [ ] Fill the same values into `assets/js/config.js` and reload: the placeholder must turn into
      a real link whose visible text is the address itself, and the social icons must appear.
- [ ] Turn JavaScript off in the browser (DevTools → Settings → Disable JavaScript) and reload
      every page. All content must still be visible — the scroll-reveal blocks included.
- [ ] Block `assets/js/main.js` in DevTools' network panel and reload: within two seconds the
      reveal blocks must become visible again on their own.
- [ ] Run Lighthouse (mobile and desktop) on the homepage, `/services/` and `/contact/`.
- [ ] Validate the structured data at
      [search.google.com/test/rich-results](https://search.google.com/test/rich-results).
- [ ] Check `robots.txt` and `sitemap.xml` in the browser.
- [ ] Visit a non-existent URL and confirm the 404 page is served.

---

## 12. Deployment

The site is a folder of static files. Deploy the **contents of `Website/` excluding `tools/`** to
the **document root** of your domain.

### Netlify (free, simplest)

```bash
npm install -g netlify-cli
netlify login
cd Website
netlify deploy --prod --dir . \
  --exclude tools \
  --exclude .gitignore
```

Then in Netlify: **Site settings → Domain management → Add a custom domain**, and set the DNS
records it gives you. Netlify serves `404.html` automatically for unmatched paths.

### Vercel

```bash
npm install -g vercel
cd Website
vercel --prod
```

Add `vercel.json` if you want to exclude `tools`:

```json
{
  "cleanUrls": false,
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### GitHub Pages

Push the repository, then **Settings → Pages → Source: Deploy from a branch → `main` / `/root`**.
GitHub Pages serves the repository root; if you push the whole repo, either put the site files
in the repository root or point Pages at a `/Website` folder. Note that GitHub Pages does not
serve `404.html` automatically — add a `404.html` in the publishing root (already present).

### Traditional shared hosting (cPanel)

1. Connect FTP and upload everything **except** `tools/` into `public_html/`.
2. In cPanel, open **MultiPHP INI Editor** and set `upload_max_filesize` / `post_max_size` if you
   plan to accept large uploads (not needed for this site as shipped).
3. `public_html/.htaccess` — add a custom error document and correct MIME types:

   ```apache
   ErrorDocument 404 /404.html
   AddType image/avif .avif
   AddType image/webp .webp
   AddType font/woff2 .woff2
   AddType application/manifest+json .webmanifest

   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml application/xml
   </IfModule>

   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType text/css "access plus 1 year"
     ExpiresByType application/javascript "access plus 1 year"
     ExpiresByType image/webp "access plus 1 year"
     ExpiresByType image/avif "access plus 1 year"
     ExpiresByType font/woff2 "access plus 1 year"
   </IfModule>
   ```

4. Enable **HTTPS** and force a redirect to `https://`.

### Amazon S3 + CloudFront

Upload to an S3 bucket with static website hosting enabled (or use CloudFront with an S3 origin).
Set the index document to `index.html` and the error document to `404.html`. Set
`Cache-Control: max-age=31536000` on the `assets/` prefix.

### After deploying — the checklist

1. `https://www.brandingpeedika.com/` loads over HTTPS and the lock icon is present.
2. `https://www.brandingpeedika.com/sitemap.xml` and `/robots.txt` are reachable.
3. `https://www.brandingpeedika.com/any-random-url` shows the custom 404 page.
4. The canonical URL in every page's `<head>` uses the live domain.
5. Brotli or Gzip is on for HTML, CSS, JS and SVG (see the `curl` command above).
6. The social links in the footer are visible and point to the right profiles.
7. The enquiry form sends and receives correctly.
8. Submit the sitemap to Google Search Console and Bing Webmaster Tools.
9. Test a shared link on WhatsApp and on X/Twitter to confirm the preview image renders.
10. Run Lighthouse against the live URL and compare it with the numbers in
    [Performance](#10-performance).

---

## 13. Image and font attribution

### Photography

All photographs are from **Wikimedia Commons** and are openly licensed. They have been resized
and re-encoded (AVIF + WebP). Derivative crops of **CC BY-SA** images remain under the same
licence. The full, machine-readable record — including the source URL for every file — is in
`tools/sources.resolved.json`.

| File used on the site | Original | Author | Licence |
| --- | --- | --- | --- |
| `kerala-village-tea-shop` | [A village tea shop in Kerala](https://commons.wikimedia.org/wiki/File:A_village_tea_shop_in_Kerala.jpg) | Shagil Kannur | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `indian-market-shopkeeper` | [Shopkeeper - Indian Market](https://commons.wikimedia.org/wiki/File:Shopkeeper_-_Indian_Market.jpg) | RioRiyoRio | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
| `india-woman-dairy-entrepreneur` | [India - Woman dairy entrepreneur](https://commons.wikimedia.org/wiki/File:India_-_Woman_dairy_entrepreneur_(3975844335).jpg) | McKay Savage | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `kerala-vegetable-shop-edavanna` | [Vegetable shop in Edavanna, Malappuram](https://commons.wikimedia.org/wiki/File:Vegetable_shop_in_Edavanna,_Malappuram_Distsrict,_Kerala,_India.jpg) | Prof tpms | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `kerala-spice-shop-munnar` | [Spices in a shop Kerala](https://commons.wikimedia.org/wiki/File:Spices_in_a_shop_Kerala.jpg) | Saiphani02 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `kerala-bakery-kozhikode` | [Kozhikodan Bakery, Kaloor Road, Kozhikode](https://commons.wikimedia.org/wiki/File:Kozhikodan_Bakery,_Kaloor_Road,_Kozhikode.jpg) | Prof tpms | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `kerala-street-vendor-kannur` | [Thavakkara Vegetable shop](https://commons.wikimedia.org/wiki/File:Thavakkara_Vegetable_shop.jpg) | Shareef Taliparamba | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| `kozhikode-local-market` | [Poovaranthode local market](https://commons.wikimedia.org/wiki/File:Poovaranthode_local_market.png) | Davidjose365 | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| `kochi-craft-market` | [Crafters shop and market in Mattancherry, Kochi](https://commons.wikimedia.org/wiki/File:Crafters_shop_and_market_in_mattancherry_kochi_Kerela.jpg) | Manishontop02 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `fort-kochi-fish-market` | [Fish seller in Fort Kochi](https://commons.wikimedia.org/wiki/File:Fish_seller_in_Fort_Kochi,_India,_2_March_2019.jpg) | Alexey Komarov | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `kerala-handicraft-shop` | [Horse handicraft of Kerala](https://commons.wikimedia.org/wiki/File:Horse_handicraft_of_Kerala_(2168583056).jpg) | fraboof | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| `kerala-toddy-shop` | [Toddy Shop at Koothattukulam](https://commons.wikimedia.org/wiki/File:Toddy_Shop_at_Koothattukulam_112953.jpg) | Rameshng | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `kerala-fort-kochi-mural` | [Fort Kochi - Mural of Na'vi](https://commons.wikimedia.org/wiki/File:Fort_Kochi_-_Mural_of_Na%27vi.jpg) | Ingo Mehling | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |

**Attribution line to publish** (required by the CC BY / CC BY-SA licences):

> Photographs by Shagil Kannur, RioRiyoRio, McKay Savage, Prof tpms, Saiphani02, Shareef
> Taliparamba, Davidjose365, Manishontop02, Alexey Komarov, fraboof, Rameshng and Ingo Mehling,
> used under CC BY / CC BY-SA / CC0 via Wikimedia Commons.

### Original artwork

* The six **sample concept mock-ups** (`assets/images/concept-*.svg`) are original work created
  for this site. The brands depicted are fictional and are not client work.
* The **favicon and app icons** (`assets/icons/`) are a typographic "BP" monogram drawn as SVG
  paths, also original.
* The **Open Graph image** (`assets/images/og-branding-peedika.png`) is generated from the site's
  own type and colour tokens by `tools/make-og.js`.

### Fonts

* **Manrope** — Copyright 2018 The Manrope Project Authors. Licensed under the
  [SIL Open Font License 1.1](https://scripts.sil.org/OFL).
* **Inter** — Copyright The Inter Project Authors. Licensed under the
  [SIL Open Font License 1.1](https://scripts.sil.org/OFL).

Both are self-hosted, latin subset, variable weight. The OFL permits self-hosting and
redistribution.

### Icons

All interface icons are hand-written inline SVG. No icon font, no third-party icon library.

---

## 14. Browser support

Current Chrome, Edge, Firefox and Safari (desktop and mobile), plus the last two versions of
iOS Safari. The site uses CSS custom properties, `aspect-ratio`, `clamp()`, `IntersectionObserver`,
`fetch` and `URLSearchParams`. Where a feature is missing the page still renders and reads
correctly — the reveal animation simply does not run.

No polyfills are included, to keep the payload small. If you need to support Internet Explorer,
you are building a different website.

---

## 15. Things to do before launch

- [ ] Fill in every `REPLACE` value in `assets/js/config.js`.
- [ ] Set the live domain in `config.js`, `tools/build-site.js`, `sitemap.xml` and `robots.txt`,
      then re-run `node tools/build-site.js`.
- [ ] Connect a form endpoint and test a real submission.
- [ ] Replace the text wordmark with the real logo (SVG) if one exists, and regenerate the icons
      with `node tools/make-icons.js`.
- [ ] Replace the six sample concepts with real project work, or keep them with the existing
      disclaimer (the disclaimer is doing honest work — do not remove it while the concepts are
      fictional).
- [ ] Add real photography, keeping the attribution table updated.
- [ ] Add a genuine client testimonial section **only** when you have permission to quote real
      people, and add the review schema then.
- [ ] Confirm the privacy policy reflects what you actually do (hosting provider, email provider,
      form provider, analytics).
- [ ] Update the "Last updated" date in `privacy-policy` and the `<lastmod>` values in
      `sitemap.xml`.
- [ ] Run `node tools/validate.js`, `node tools/audit.js` and the manual
      [testing checklist](#11-testing-checklist).
- [ ] Deploy, then submit the sitemap to Google Search Console and Bing Webmaster Tools.

---

**Branding Peedika** — *Where Every Brand Begins.*
