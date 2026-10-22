/**
 * pages.js — per-page metadata for the static site build.
 * Every title, meta description and canonical path lives here.
 */
const SERVICES_BC = (name, slug) => [
  { name: 'Home', url: '/' },
  { name: 'Services', url: '/services/' },
  { name, url: `/services/${slug}/` }
];

/**
 * The service catalogue is declared once and reused by the service detail
 * pages and the /services/ hub, so the structured data can never drift
 * away from the page copy.
 */
const SERVICES = {
  branding: {
    name: 'Branding and Logo Design',
    serviceType: 'Brand identity design',
    url: '/services/branding-logo-design/',
    description:
      'Brand identity design for small businesses in Kerala, including logo concepts, colour palettes, typography and brand consistency guidelines.'
  },
  social: {
    name: 'Social Media Marketing',
    serviceType: 'Social media marketing',
    url: '/services/social-media-marketing/',
    description:
      'Social media strategy, account content planning, post and campaign planning and audience engagement for small businesses and local shops in Kerala.'
  },
  content: {
    name: 'Content Creation',
    serviceType: 'Content creation',
    url: '/services/content-creation/',
    description:
      'Social media creatives, caption and copywriting, short-form video concepts, promotional content and brand storytelling for small businesses.'
  },
  website: {
    name: 'Website Development',
    serviceType: 'Website development',
    url: '/services/website-development/',
    description:
      'Responsive business websites, landing pages and service websites with enquiry functionality, performance best practice and on-page SEO fundamentals.'
  },
  marketing: {
    name: 'Digital Marketing',
    serviceType: 'Digital marketing',
    url: '/services/digital-marketing/',
    description:
      'Digital marketing strategy, search engine optimisation, local SEO, Google Business Profile optimisation, Meta advertising campaign support and conversion tracking.'
  },
  local: {
    name: 'Digital Presence for Local Businesses',
    serviceType: 'Local SEO and Google Business Profile',
    url: '/services/digital-marketing/#local-presence',
    id: '/services/digital-marketing/#local-presence',
    description:
      'Local presence for shops and service businesses: Google Business Profile setup, map listings, local search optimisation and neighbourhood-level visibility.'
  }
};

/* The five articles on /blog/. Each one is a section of that page, so the
   URL is the page URL plus the article anchor. */
const POSTS = [
  {
    id: 'google-business-profile',
    headline: 'Your Google Business Profile matters more than your logo',
    datePublished: '2026-10-21',
    description:
      'For most local shops the listing on the map is the single highest-return thing they own — what to fill in, in what order, and why.'
  },
  {
    id: 'phone-photography',
    headline: 'What to photograph on your phone so posts look professional',
    datePublished: '2026-10-21',
    description:
      'You do not need a camera, a studio or a photographer. You need light, a clean surface and six repeatable shots — a practical checklist.'
  },
  {
    id: 'captions-that-get-replies',
    headline: 'How to write a caption that gets replies instead of likes',
    datePublished: '2026-10-21',
    description:
      'Likes are cheap and quiet, replies start a conversation. A simple structure for captions that invites the right people in.'
  },
  {
    id: 'small-business-website',
    headline: 'Five things a small-business website must have',
    datePublished: '2026-10-21',
    description:
      'Not a feature list: five things that decide whether a visitor calls you, messages you, or quietly closes the tab.'
  },
  {
    id: 'pricing-a-branding-project',
    headline: 'How to price a branding project without getting taken for a ride',
    datePublished: '2026-10-21',
    description:
      'What you are actually paying for, why quotes differ so much, and the four questions that reveal most of the difference.'
  }
];

module.exports = [
  {
    key: 'home',
    file: 'index.html',
    url: '/',
    title: 'Digital Marketing for Small Businesses in Kerala | Branding Peedika',
    description:
      'Branding Peedika helps Kerala\u2019s small businesses build a stronger brand, show up online and win more customers. Branding, social, content, websites and marketing.',
    ogType: 'website',
    webPageType: 'WebPage'
  },
  {
    key: 'about',
    file: 'about/index.html',
    url: '/about/',
    title: 'About Us — Every Brand Has a Beginning | Branding Peedika',
    description:
      'Meet Branding Peedika: a Kerala-rooted creative partner helping small businesses build thoughtful branding, digital tools and marketing they can keep up.',
    webPageType: 'AboutPage',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'About', url: '/about/' }
    ]
  },
  {
    key: 'services',
    file: 'services/index.html',
    url: '/services/',
    title: 'Services — Branding, Social, Content & Websites | Branding Peedika',
    description:
      'Six practical services for small businesses in Kerala: branding and logo design, social media marketing, content creation, websites and digital marketing.',
    webPageType: 'CollectionPage',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Services', url: '/services/' }
    ],
    /* every service the hub lists, so the page can describe all six */
    services: [
      SERVICES.branding,
      SERVICES.social,
      SERVICES.content,
      SERVICES.website,
      SERVICES.marketing,
      SERVICES.local
    ]
  },
  {
    key: 'branding',
    file: 'services/branding-logo-design/index.html',
    url: '/services/branding-logo-design/',
    title: 'Branding & Logo Design for Kerala Small Businesses | Branding Peedika',
    description:
      'Logo concepts, colour palettes, typography and consistency systems for Kerala small businesses. One identity that looks the same on a board, a story and a site.',
    webPageType: 'WebPage',
    breadcrumbs: SERVICES_BC('Branding & Logo Design', 'branding-logo-design'),
    service: SERVICES.branding
  },
  {
    key: 'social',
    file: 'services/social-media-marketing/index.html',
    url: '/services/social-media-marketing/',
    title: 'Social Media Marketing for Local Businesses | Branding Peedika',
    description:
      'Social media marketing for local businesses: channel strategy, content planning, campaign ideas, audience engagement and platform-specific communication.',
    webPageType: 'WebPage',
    breadcrumbs: SERVICES_BC('Social Media Marketing', 'social-media-marketing'),
    service: SERVICES.social
  },
  {
    key: 'content',
    file: 'services/content-creation/index.html',
    url: '/services/content-creation/',
    title: 'Content Creation for Small Businesses | Branding Peedika',
    description:
      'Social media creatives, captions, short-form video concepts, promotional content and brand storytelling that make your business worth following.',
    webPageType: 'WebPage',
    breadcrumbs: SERVICES_BC('Content Creation', 'content-creation'),
    service: SERVICES.content
  },
  {
    key: 'website',
    file: 'services/website-development/index.html',
    url: '/services/website-development/',
    title: 'Website Development for Small Businesses in Kerala | Branding Peedika',
    description:
      'Fast, mobile-friendly business websites, landing pages and service sites with working enquiry forms, performance best practice and SEO fundamentals built in.',
    webPageType: 'WebPage',
    breadcrumbs: SERVICES_BC('Website Development', 'website-development'),
    service: SERVICES.website
  },
  {
    key: 'marketing',
    file: 'services/digital-marketing/index.html',
    url: '/services/digital-marketing/',
    title: 'Digital Marketing Services in Kerala | Branding Peedika',
    description:
      'Digital marketing strategy, search engine optimisation, local SEO, Google Business Profile optimisation, Meta campaign support and conversion tracking.',
    webPageType: 'WebPage',
    breadcrumbs: SERVICES_BC('Digital Marketing', 'digital-marketing'),
    service: SERVICES.marketing
  },
  {
    key: 'portfolio',
    file: 'portfolio/index.html',
    url: '/portfolio/',
    title: 'Portfolio — Sample Brand, Content & Web Concepts | Branding Peedika',
    description:
      'A gallery of sample concept projects from Branding Peedika showing our approach to brand identity, social content, packaging, posters and website design.',
    webPageType: 'CollectionPage',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Portfolio', url: '/portfolio/' }
    ]
  },
  {
    key: 'blog',
    file: 'blog/index.html',
    url: '/blog/',
    title: 'Blog — Marketing Ideas for Kerala Small Businesses | Branding Peedika',
    description:
      'Practical, jargon-free writing on branding, social media, websites and local SEO for small businesses and local entrepreneurs in Kerala.',
    webPageType: 'Blog',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog/' }
    ],
    posts: POSTS
  },
  {
    key: 'contact',
    file: 'contact/index.html',
    url: '/contact/',
    title: 'Contact Us — Start a Conversation | Branding Peedika',
    description:
      'Tell us where your business is today and where you want it to go. Send an enquiry about branding, social media, content, websites or digital marketing.',
    webPageType: 'ContactPage',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Contact', url: '/contact/' }
    ]
  },
  {
    key: 'privacy',
    file: 'privacy-policy/index.html',
    url: '/privacy-policy/',
    title: 'Privacy Policy | Branding Peedika',
    description:
      'How Branding Peedika handles information you share through this website, what we collect, why we collect it and the choices available to you.',
    webPageType: 'WebPage',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Privacy Policy', url: '/privacy-policy/' }
    ]
  },
  {
    key: 'notfound',
    file: '404.html',
    url: '/404.html',
    title: 'Page Not Found | Branding Peedika',
    description: 'The page you were looking for could not be found. Head back to the home page or explore our services.',
    ogType: 'website',
    webPageType: 'WebPage',
    robots: 'noindex, follow'
  }
];
