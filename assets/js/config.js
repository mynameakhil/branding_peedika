/* ==========================================================================
   Branding Peedika — site configuration
   --------------------------------------------------------------------------
   SINGLE SOURCE OF TRUTH for every business detail that can change.

   Anything below marked "REPLACE" is intentionally left blank. The site is
   fully functional without them: placeholders are rendered in the UI and the
   contact form falls back to a clearly-labelled "not configured" message
   instead of pretending an enquiry was delivered.

   Deploy checklist: fill in every REPLACE value, then update the same
   domain in sitemap.xml, robots.txt and each page's <link rel="canonical">.
   ========================================================================== */

window.BP_CONFIG = {
  /* --- Business identity ------------------------------------------------ */
  businessName: 'Branding Peedika',
  legalName: '', // REPLACE: registered entity name, if different
  tagline: 'Where Every Brand Begins.',
  description:
    'Branding Peedika is a digital marketing and branding studio for small businesses in Kerala — brand identity, social media, content creation, websites and practical digital marketing.',

  /* --- Domain ------------------------------------------------------------
     Used for canonical URLs, Open Graph URLs, sitemap and JSON-LD.
     The sitemap and robots.txt are static files and must be updated by hand
     to match this value. */
  siteUrl: 'https://www.brandingpeedika.com', // REPLACE with the live domain
  locale: 'en_IN',
  lang: 'en-IN',

  /* --- Contact details ---------------------------------------------------
     These are deliberately EMPTY. The site must not state a phone number,
     an email address, an address or opening hours that nobody has confirmed.
     While a value is empty the page shows a clearly-labelled placeholder
     instead (see the `data-bp` elements in the HTML). Fill them in and the
     placeholders turn into the real thing automatically. */
  email: '', // REPLACE: e.g. hello@brandingpeedika.com
  phone: '', // REPLACE: e.g. +91 98765 43210
  whatsapp: '', // REPLACE: e.g. '+91 98765 43210' — shown as written, linked as wa.me/<digits>
  address: '', // REPLACE: business address, if the business has a public address
  businessHours: '', // REPLACE: e.g. 'Monday to Saturday, 10:00 AM – 6:00 PM IST'

  /* --- Social profiles --------------------------------------------------- */
  social: {
    instagram: '', // REPLACE: full URL
    facebook: '', // REPLACE: full URL
    linkedin: '', // REPLACE: full URL
    youtube: '', // REPLACE: full URL
    twitter: '' // REPLACE: full URL
  },

  /* --- Enquiry form ------------------------------------------------------
     HTML + JavaScript cannot deliver mail on their own. Point `formEndpoint`
     at a form-handling service (Formspree, Web3Forms, Basin, a Cloudflare
     Worker, your own API...) and the form will POST to it via fetch().

     Supported: any endpoint that accepts JSON POST bodies and answers with
     2xx on success. Formspree/Basin accept FormData as well — this script
     sends JSON and falls back to FormData if JSON is rejected.

     Leave blank to keep the site in "enquiry form not connected" mode. */
  formEndpoint: '', // REPLACE
  formEndpointType: 'json', // 'json' | 'formdata'

  /* --- Regional ---------------------------------------------------------- */
  region: 'Kerala, India',
  serviceArea: 'Kerala, India',
  location: {
    addressLocality: '', // REPLACE (only if a real public address exists)
    addressRegion: 'Kerala',
    addressCountry: 'IN'
  }
};
