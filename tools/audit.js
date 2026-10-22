'use strict';
/* ==========================================================================
   audit.js — the site's own accessibility / layout regression harness.

   Run it with the dev server up:

       node tools/serve.js -p 8080      # in one terminal
       node tools/audit.js              # in another

   It performs four checks and exits non-zero if any of them fails:

     1. GEOMETRY   every page at 390 / 768 / 1280 / 1440 px: no horizontal
                   overflow, no clipped text, no broken images, no invisible
                   text, no duplicate ids, no unlabelled fields, no heading
                   skips, exactly one <h1>, every image has alt text, the
                   [hidden] attribute is always honoured, and every
                   interactive target is at least 24 x 24 CSS px
                   (WCAG 2.2 SC 2.5.8).
     2. AXE        axe-core against every page: WCAG 2.0/2.1/2.2 A + AA and
                   the best-practice ruleset.
     3. CONTACTS   the placeholder contract: with nothing configured the
                   email / phone / WhatsApp entries are NOT links (no href,
                   not in the tab order) and the social row and copy-email
                   button stay hidden; with a config supplied they become
                   real links whose visible text matches the destination.
     4. NO-JS      the site is still readable with scripting disabled.

   Chrome is found automatically on Windows / macOS / Linux. Override with
   the CHROME_PATH environment variable if it lives somewhere unusual.

   Requires the optional dev dependencies (puppeteer-core, axe-core):
       cd tools && npm install
   ========================================================================== */

const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer-core');

const BASE = process.env.BASE_URL || 'http://localhost:8080';
const AXE_PATH = path.join(__dirname, 'node_modules', 'axe-core', 'axe.min.js');

const PAGES = [
  ['/', 'home'], ['/about/', 'about'], ['/services/', 'services'],
  ['/services/branding-logo-design/', 'branding'], ['/services/social-media-marketing/', 'social'],
  ['/services/content-creation/', 'content'], ['/services/website-development/', 'website'],
  ['/services/digital-marketing/', 'marketing'], ['/portfolio/', 'portfolio'],
  ['/blog/', 'blog'], ['/contact/', 'contact'], ['/privacy-policy/', 'privacy'],
  ['/404.html', '404']
];
const VIEWPORTS = [390, 768, 1280, 1440];

/* ---------------------------------------------------------------- chrome -- */
function findChrome() {
  const fromEnv = process.env.CHROME_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  const candidates = {
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ],
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    ],
    linux: [
      '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium'
    ]
  };
  for (const c of candidates[process.platform] || []) if (fs.existsSync(c)) return c;
  return null;
}

/* ------------------------------------------------------------- geometry -- */
/* Runs in the page. Returns a list of human-readable problems. */
const GEOMETRY = () => {
  const out = [];
  const push = (type, detail) => out.push(type + ': ' + detail);
  const vw = document.documentElement.clientWidth;

  /* 1. the document must not scroll sideways */
  const scrollW = document.documentElement.scrollWidth;
  if (scrollW > vw + 1) push('doc-overflow', scrollW + ' > ' + vw);

  /* 2. no visible element may stick out past the right edge */
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right <= vw + 2) continue;
    let p = el.parentElement, scrollable = false;
    while (p && p !== document.body) {
      const pcs = getComputedStyle(p);
      if (/(auto|scroll)/.test(pcs.overflowX) && p.scrollWidth > p.clientWidth) { scrollable = true; break; }
      p = p.parentElement;
    }
    if (scrollable) continue;
    if (cs.position === 'absolute' || cs.position === 'fixed') continue;
    push('el-overflow-right',
      el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ')[0] +
      ' right=' + Math.round(r.right) + ' vw=' + vw);
  }

  /* 3. every image must load and occupy space */
  for (const img of document.querySelectorAll('img')) {
    const src = (img.currentSrc || img.src).slice(-60);
    if (!img.complete || img.naturalWidth === 0) push('broken-image', src);
    const r = img.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) push('image-zero-size', src);
    if (img.getAttribute('alt') === null) push('missing-alt', src);
  }

  /* 4. text must not be clipped by its own box */
  for (const el of document.querySelectorAll('p,h1,h2,h3,h4,li,a,span,td,th,label,button,figcaption')) {
    if (el.children.length) continue;
    if (el.closest('.visually-hidden') || el.classList.contains('visually-hidden')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.overflowY === 'hidden') {
      const text = (el.textContent || '').trim().slice(0, 40);
      if (el.scrollWidth > el.clientWidth + 2 && cs.textOverflow !== 'ellipsis') {
        push('clipped-text-x', el.tagName.toLowerCase() + ' "' + text + '"');
      }
      if (el.scrollHeight > el.clientHeight + 2) {
        push('clipped-text-y', el.tagName.toLowerCase() + ' "' + text + '"');
      }
    }
  }

  /* 5. WCAG 2.2 SC 2.5.8 — target size (24 x 24 CSS px minimum).
        The inline and spacing exceptions are honoured. */
  const targets = [];
  for (const el of document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || el.disabled || el.closest('[hidden]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    targets.push({ el, r, label: (el.textContent || el.getAttribute('aria-label') || el.name || el.type || '').trim().slice(0, 30) });
  }
  for (const t of targets) {
    if (t.r.width >= 24 && t.r.height >= 24) continue;
    const pTag = t.el.parentElement ? t.el.parentElement.tagName.toLowerCase() : '';
    const inlineContext = ['p', 'li', 'dd', 'td', 'label', 'blockquote', 'span'].includes(pTag) &&
      !t.el.classList.contains('btn') && !t.el.classList.contains('link-arrow');
    if (inlineContext) continue;
    const cx = t.r.left + t.r.width / 2, cy = t.r.top + t.r.height / 2;
    let tooClose = false;
    for (const o of targets) {
      if (o === t) continue;
      const ox = o.r.left + o.r.width / 2, oy = o.r.top + o.r.height / 2;
      if (Math.hypot(ox - cx, oy - cy) < 24) { tooClose = true; break; }
    }
    if (tooClose) continue;
    push('tap-target-small', t.el.tagName.toLowerCase() + ' ' +
      Math.round(t.r.width) + 'x' + Math.round(t.r.height) + ' "' + t.label + '"');
  }

  /* 6. no invisible text */
  for (const el of document.querySelectorAll('h1,h2,h3,p,li,a,button,label')) {
    if (!el.textContent || !el.textContent.trim()) continue;
    if (el.closest('.visually-hidden')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (parseFloat(cs.opacity) < 0.05) {
      push('transparent-text', el.tagName.toLowerCase() + ' "' + el.textContent.trim().slice(0, 30) + '"');
    }
  }

  /* 7. unique ids */
  const ids = {};
  for (const el of document.querySelectorAll('[id]')) ids[el.id] = (ids[el.id] || 0) + 1;
  for (const id in ids) if (ids[id] > 1) push('duplicate-id', id + ' x' + ids[id]);

  /* 8. every form field needs a label */
  for (const f of document.querySelectorAll('input:not([type=hidden]),select,textarea')) {
    if (f.closest('[data-enquiry-form]') === null) continue;
    if (!(f.labels && f.labels.length) && !f.getAttribute('aria-label') && !f.getAttribute('aria-labelledby')) {
      push('unlabelled-field', f.name || f.id || f.type);
    }
  }

  /* 9. heading order */
  const levels = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) => +h.tagName[1]);
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) push('heading-skip', 'h' + levels[i - 1] + ' -> h' + levels[i]);
  }
  const h1s = document.querySelectorAll('h1').length;
  if (h1s !== 1) push('h1-count', String(h1s));

  /* 10. the hidden attribute must actually hide */
  for (const el of document.querySelectorAll('[hidden]')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 || r.height > 0) push('hidden-but-painted', el.tagName + '.' + String(el.className || '').split(' ')[0]);
  }

  /* 11. no section may collapse to nothing */
  for (const s of document.querySelectorAll('section,header,footer,main')) {
    if (s.getBoundingClientRect().height < 2) push('zero-height-block', s.tagName.toLowerCase() + '.' + String(s.className || '').split(' ')[0]);
  }

  return out;
};

/* Put the page into its final, measurable state: every lazy image loaded,
   every scroll-reveal block revealed and its transition finished. */
async function settle(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
  });
  await page.evaluate(async () => {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      const pending = Array.from(document.querySelectorAll('img')).filter((i) => !i.complete);
      if (!pending.length) break;
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  await page.evaluate(async () => {
    const started = Array.from(document.images).filter((i) => i.currentSrc || i.src);
    const timeout = (p) => Promise.race([p, new Promise((r) => setTimeout(r, 5000))]);
    await Promise.all(started.map((i) => (i.decode && i.complete ? timeout(i.decode().catch(() => {})) : Promise.resolve())));
  });
  await page.evaluate(async () => {
    const step = 400;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 300));
  });
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-revealed'));
  });
  /* the longest reveal is 240 ms of delay + 600 ms of duration */
  await new Promise((r) => setTimeout(r, 1500));
}

/* ------------------------------------------------------------- contacts -- */
const CONTACT_PROBE = () => {
  const links = [];
  document.querySelectorAll('[data-bp]').forEach((el) => {
    const key = el.getAttribute('data-bp');
    if (!['email', 'phone', 'whatsapp'].includes(key)) return;
    links.push({
      key,
      hasHref: el.hasAttribute('href'),
      href: el.getAttribute('href'),
      text: (el.textContent || '').trim().slice(0, 46),
      cursor: getComputedStyle(el).cursor
    });
  });
  const soc = document.querySelector('ul.social');
  const copyBtn = document.querySelector('[data-copy-email]');
  return {
    links,
    socialRowHidden: soc ? soc.hasAttribute('hidden') : null,
    socialLinks: Array.from(document.querySelectorAll('[data-bp-social]'))
      .map((a) => ({ key: a.getAttribute('data-bp-social'), href: a.getAttribute('href') })),
    copyBtnHidden: copyBtn ? copyBtn.hasAttribute('hidden') : null
  };
};

/* Walk the page with the real keyboard and report any [data-bp] element the
   Tab key lands on. An <a> with no href reports tabIndex 0 but is NOT in the
   sequential focus order, so only a real key press settles the question. */
async function tabbableBp(page) {
  await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
  const hits = [];
  for (let i = 0; i < 70; i++) {
    await page.keyboard.press('Tab');
    const hit = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      return {
        bp: a.getAttribute && a.getAttribute('data-bp'),
        bpSocial: a.getAttribute && a.getAttribute('data-bp-social')
      };
    });
    if (hit && (hit.bp || hit.bpSocial)) hits.push(hit);
  }
  return hits;
}

/* ------------------------------------------------------------------ retry -- */
/* A busy machine can make a single CDP round-trip exceed the protocol
   timeout, and a renderer occasionally detaches mid-navigation. That is an
   environment problem, not a defect in the site, so the page is measured
   again on a fresh tab. */
async function withRetry(label, attempts, fn, reset) {
  let last = null;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const transient = /timed out|ProtocolError|Target closed|Session closed|ECONNRESET|detached|crash|Navigation failed/i
        .test(String((e && e.message) || e));
      if (!transient || i === attempts) break;
      console.log('  ... ' + label + ' hit a browser error, retrying (' + i + '/' + attempts + ')');
      if (reset) await reset();
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw last;
}

/* One tab, reused for every check in a phase. Opening and closing 65 tabs
   in a single browser is what makes the renderer flakiness show up. */
function makePageHolder(browser, opts) {
  const options = opts || {};
  let page = null;
  return {
    async get() {
      if (!page || page.isClosed()) {
        page = await browser.newPage();
        page.setDefaultTimeout(60000);
        if (options.viewport) await page.setViewport(options.viewport);
        if (options.noJs) await page.setJavaScriptEnabled(false);
        if (options.intercept) await options.intercept(page);
      }
      return page;
    },
    async reset() {
      if (page) { await page.close().catch(() => {}); page = null; }
    }
  };
}

/* ------------------------------------------------------------------ run -- */
(async () => {
  const chrome = findChrome();
  if (!chrome) {
    console.error('Could not find Chrome. Set CHROME_PATH to the browser executable.');
    process.exit(2);
  }
  if (!fs.existsSync(AXE_PATH)) {
    console.error('axe-core is missing. Run: cd tools && npm install');
    process.exit(2);
  }
  try {
    const res = await fetch(BASE + '/', { method: 'GET' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
  } catch (e) {
    console.error('The dev server is not answering on ' + BASE + ' (' + e.message + ').');
    console.error('Start it first:  node tools/serve.js -p 8080');
    process.exit(2);
  }

  const AXE = fs.readFileSync(AXE_PATH, 'utf8');

  /* Each phase gets its own browser. A headless run that loads 65+ pages in
     one instance accumulates enough memory to make the renderer fall over on
     a machine that is already busy (a real Chrome open alongside it).
     The extra flags keep the headless instance as small and idle as possible. */
  const CHROME_ARGS = [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-sync',
    '--no-first-run',
    '--no-default-browser-check',
    '--mute-audio'
  ];
  const launch = () => puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    /* The default 180 s protocol timeout is easy to hit on a busy machine,
       where the real browser and this headless instance compete for CPU. */
    protocolTimeout: 300000,
    /* BP_AUDIT_DUMP=1 pipes Chrome's own stderr to the console, which is the
       only way to see why the browser died when it does. */
    dumpio: !!process.env.BP_AUDIT_DUMP,
    args: CHROME_ARGS
  });
  async function runPhase(label, fn) {
    return await withRetry(label, 3, async () => {
      const b = await launch();
      try {
        return await fn(b);
      } finally {
        await b.close().catch(() => {});
      }
    });
  }

  const failures = [];
  const fail = (m) => { failures.push(m); console.log('  x ' + m); };

  /* ---- 1. geometry ---- */
  console.log('\n[1/4] GEOMETRY - 13 pages x ' + VIEWPORTS.length + ' viewports');
  let geomChecks = 0;
  /* The browser is recycled every few pages. A headless Chrome that has
     rendered a dozen full pages holds on to a surprising amount of memory,
     and on a busy machine that is what tips the renderer over. */
  const CHUNK = 3;
  for (const w of VIEWPORTS) {
    for (let i = 0; i < PAGES.length; i += CHUNK) {
      const chunk = PAGES.slice(i, i + CHUNK);
      await runPhase('geometry @' + w + 'px', async (browser) => {
        const holder = makePageHolder(browser, { viewport: { width: w, height: 900, deviceScaleFactor: 1 } });
        for (const [p, name] of chunk) {
          const label = 'geometry ' + name + ' @' + w + 'px';
          const uniq = await withRetry(label, 3, async () => {
            const page = await holder.get();
            await page.goto(BASE + p, { waitUntil: 'networkidle0', timeout: 45000 });
            await page.evaluate(() => document.fonts.ready);
            await settle(page);
            const problems = await page.evaluate(GEOMETRY);
            return [...new Set(problems)];
          }, () => holder.reset());
          geomChecks++;
          if (uniq.length) {
            console.log('  ' + name + ' @' + w + 'px');
            uniq.forEach((x) => fail(name + ' @' + w + 'px  ' + x));
          }
        }
        await holder.reset();
      });
    }
  }
  console.log('  ' + geomChecks + ' page/viewport combinations checked, ' +
    failures.length + ' problem(s)');

  /* ---- 2. axe ---- */
  console.log('\n[2/4] AXE - WCAG 2.0/2.1/2.2 A + AA and best practices');
  const totals = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (let i = 0; i < PAGES.length; i += CHUNK) {
    const chunk = PAGES.slice(i, i + CHUNK);
    await runPhase('axe', async (browser) => {
      const holder = makePageHolder(browser, { viewport: { width: 1280, height: 900 } });
      for (const [p, name] of chunk) {
        const violations = await withRetry('axe ' + name, 3, async () => {
          const page = await holder.get();
          await page.goto(BASE + p, { waitUntil: 'networkidle0', timeout: 45000 });
          await settle(page);
          await page.evaluate(AXE);
          return await page.evaluate(async () => {
            const r = await window.axe.run(document, {
              runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }
            });
            return r.violations.map((v) => ({
              id: v.id, impact: v.impact, help: v.help,
              nodes: v.nodes.map((n) => n.target.join(' '))
            }));
          });
        }, () => holder.reset());
        const count = violations.reduce((a, v) => a + v.nodes.length, 0);
        if (count) {
          console.log('  ' + name + ' - ' + count + ' violation(s)');
          violations.forEach((v) => {
            totals[v.impact] = (totals[v.impact] || 0) + v.nodes.length;
            fail('axe [' + v.impact + '] ' + name + ' ' + v.id + ' - ' + v.help +
              ' (' + v.nodes.slice(0, 3).join(', ') + ')');
          });
        } else {
          console.log('  ok  ' + name);
        }
      }
      await holder.reset();
    });
  }
  console.log('  violations: critical ' + (totals.critical || 0) +
    ', serious ' + (totals.serious || 0) +
    ', moderate ' + (totals.moderate || 0) +
    ', minor ' + (totals.minor || 0));

  /* ---- 3. the contact placeholder contract ---- */
  console.log('\n[3/4] CONTACTS - placeholder / hydration contract');
  {
    const { r, tabbed } = await runPhase('contacts unconfigured', async (browser) => {
      const holder = makePageHolder(browser, { viewport: { width: 1280, height: 900 } });
      const out = await withRetry('contacts unconfigured', 3, async () => {
        const page = await holder.get();
        await page.goto(BASE + '/contact/', { waitUntil: 'networkidle0', timeout: 45000 });
        return { r: await page.evaluate(CONTACT_PROBE), tabbed: await tabbableBp(page) };
      }, () => holder.reset());
      await holder.reset();
      return out;
    });

    for (const l of r.links) {
      if (l.hasHref) fail('unconfigured ' + l.key + ' must not carry an href (got ' + l.href + ')');
      if (l.cursor === 'pointer') fail('unconfigured ' + l.key + ' must not look clickable');
    }
    if (tabbed.length) fail('unconfigured contact placeholders are in the tab order: ' + JSON.stringify(tabbed));
    if (r.socialRowHidden !== true) fail('unconfigured: the social row must be hidden');
    if (r.socialLinks.some((s) => s.href)) fail('unconfigured: social links must have no href');
    if (r.copyBtnHidden !== true) fail('unconfigured: the copy-email button must be hidden');
    console.log('  ok  unconfigured state - placeholders are plain text, not links');
  }
  {
    /* serve a patched config.js so the "configured" branch can be checked too */
    /* evaluate the real config file against a throwaway window, exactly as
       validate.js does, so this can never drift from the shipped file */
    const vm = require('vm');
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'config.js'), 'utf8'), sandbox);
    const cfg = Object.assign({}, sandbox.window.BP_CONFIG);
    cfg.email = 'hello@example.com';
    cfg.phone = '+91 98765 43210';
    cfg.whatsapp = '+91 98765 43210';
    cfg.social = {
      instagram: 'https://instagram.com/example',
      facebook: 'https://facebook.com/example',
      linkedin: 'https://linkedin.com/company/example',
      youtube: 'https://youtube.com/@example',
      twitter: 'https://twitter.com/example'
    };
    const { r, tabbed } = await runPhase('contacts configured', async (browser) => {
      const holder = makePageHolder(browser, {
        viewport: { width: 1280, height: 900 },
        intercept: async (page) => {
          await page.setRequestInterception(true);
          page.on('request', (req) => {
            if (req.url().split('?')[0].endsWith('/assets/js/config.js')) {
              req.respond({ status: 200, contentType: 'application/javascript', body: 'window.BP_CONFIG = ' + JSON.stringify(cfg) + ';' });
            } else {
              req.continue();
            }
          });
        }
      });
      const out = await withRetry('contacts configured', 3, async () => {
        const page = await holder.get();
        await page.goto(BASE + '/contact/', { waitUntil: 'networkidle0', timeout: 45000 });
        return { r: await page.evaluate(CONTACT_PROBE), tabbed: await tabbableBp(page) };
      }, () => holder.reset());
      await holder.reset();
      return out;
    });

    const byKey = Object.fromEntries(r.links.map((l) => [l.key, l]));

    if (!byKey.email || byKey.email.href !== 'mailto:hello@example.com') fail('configured email: wrong href ' + (byKey.email && byKey.email.href));
    if (!byKey.email || !byKey.email.text.includes('hello@example.com')) fail('configured email: the visible text still reads ' + (byKey.email && byKey.email.text));
    if (!byKey.phone || byKey.phone.href !== 'tel:+919876543210') fail('configured phone: wrong href ' + (byKey.phone && byKey.phone.href));
    if (!byKey.phone || !byKey.phone.text.includes('98765 43210')) fail('configured phone: the visible text still reads ' + (byKey.phone && byKey.phone.text));
    if (!byKey.whatsapp || !/^https:\/\/wa\.me\/919876543210$/.test(byKey.whatsapp.href || '')) fail('configured whatsapp: wrong href ' + (byKey.whatsapp && byKey.whatsapp.href));
    if (!byKey.whatsapp || !byKey.whatsapp.text.includes('98765 43210')) fail('configured whatsapp: the visible text still reads ' + (byKey.whatsapp && byKey.whatsapp.text));
    if (r.socialRowHidden !== false) fail('configured: the social row must be visible');
    if (r.socialLinks.some((s) => !s.href)) fail('configured: every social link must have an href');
    if (r.copyBtnHidden !== false) fail('configured: the copy-email button must be visible');
    if (!tabbed.length) fail('configured: the contact links must be reachable by keyboard');
    console.log('  ok  configured state - text and href are written together');
  }

  /* ---- 4. the site without JavaScript ---- */
  console.log('\n[4/4] NO-JS - the content must still be visible');
  {
    const r = await runPhase('no-JS', async (browser) => {
      const holder = makePageHolder(browser, { viewport: { width: 1280, height: 900 }, noJs: true });
      const out = await withRetry('no-JS', 3, async () => {
        const page = await holder.get();
        await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 45000 });
        return await page.evaluate(() => {
          const blocks = Array.from(document.querySelectorAll('[data-reveal]'));
          const hidden = blocks.filter((b) => {
            const cs = getComputedStyle(b);
            return cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05;
          });
          return { total: blocks.length, hidden: hidden.length, text: document.body.innerText.length };
        });
      }, () => holder.reset());
      await holder.reset();
      return out;
    });
    if (r.hidden) fail('no-JS: ' + r.hidden + ' of ' + r.total + ' reveal blocks are invisible');
    if (r.text < 500) fail('no-JS: the page text is suspiciously short (' + r.text + ' chars)');
    console.log('  ok  ' + r.total + ' reveal blocks visible, ' + r.text + ' characters of text');
  }

  console.log('\n==================================================');
  if (failures.length) {
    console.log('FAIL - ' + failures.length + ' problem(s)');
    process.exit(1);
  }
  console.log('PASS - geometry, axe, contact contract and no-JS all clean');
})().catch((e) => {
  const msg = String((e && e.message) || e);
  console.error('\nThe audit could not finish: ' + msg);
  if (/timed out|ProtocolError|Target closed|Session closed/i.test(msg)) {
    console.error('This is a browser/machine timeout, not a finding about the site.');
    console.error('Close other Chrome windows, free some CPU, and run it again.');
  }
  console.error('If the dev server is not running: node tools/serve.js -p 8080');
  process.exit(1);
});
