/* Shared URL validation for the public entrance and its service worker. */
(() => {
  function parsePrivateURL(input, base) {
    let url;
    try { url = new URL(input, base); } catch { return null; }
    const root = new URL(base);
    const prefix = root.pathname + 'app/';
    if (url.origin !== root.origin || url.username || url.password || !url.pathname.startsWith(prefix)) return null;
    const encoded = url.pathname.slice(prefix.length);
    if (/%2f|%5c/i.test(encoded)) return null;
    let decoded;
    try { decoded = decodeURIComponent(encoded); } catch { return null; }
    if (/[\\\u0000-\u001f\u007f]/.test(decoded)) return null;
    const parts = decoded.split('/');
    const app = parts.shift();
    if (!Object.hasOwn(CMS_REVIEW_CONFIG.apps, app)) return null;
    if (parts.some((part, index) => part.startsWith('.') || (!part && index < parts.length - 1))) return null;
    let path = parts.join('/');
    if (!path || path.endsWith('/')) path += 'index.html';
    return { app, path, url };
  }
  function safeReturnURL(input, base) {
    if (typeof input !== 'string' || !input) return null;
    const route = parsePrivateURL(input, base);
    return route && route.path.endsWith('.html') ? route.url : null;
  }
  self.CMS_REVIEW_ROUTING = Object.freeze({ parsePrivateURL, safeReturnURL });
})();
