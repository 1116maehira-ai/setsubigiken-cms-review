// The authenticated preview replaces this module through its existing service worker.
// No URL query parameters, credentials, CMS source, or unpublished data are accepted here.
export const SITE_CONFIG = Object.freeze({
  apiBase: 'https://pvwktijtqtmvnqofuwro.supabase.co/functions/v1/cms-production-api',
  sitePath: '/site',
  mediaBase: null,
  preview: false,
  canonicalUrl: 'https://www.setsubi-giken-kyujin.jp/',
  noindex: true
});
