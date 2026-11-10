'use strict';
/* Only the entrance and this authentication gateway are public.
 * CMS files and data are fetched from private storage or the authenticated API.
 * No private response is written to the Cache API or used as an offline fallback.
 */
importScripts('./config.js', './routing.js', './runtime-transform.js');
const CONFIG = CMS_REVIEW_CONFIG;
const ROOT_URL = new URL(self.registration.scope);
const ROOT = ROOT_URL.pathname;
const SB = CONFIG.supabaseUrl;
const DB_NAME = CONFIG.sessionDatabase;
const STORE_NAME = 'session';
const MIME = Object.freeze({
  html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8', json: 'application/json; charset=utf-8', png: 'image/png', jpg: 'image/jpeg',
  jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif', svg: 'image/svg+xml', ico: 'image/x-icon',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
  pdf: 'application/pdf', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf'
});
const PRIVATE_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://d8j0ntlcm91z4.cloudfront.net; media-src 'self' blob:; font-src 'self' data:; connect-src 'self'; frame-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'self'";
let refreshPromise;
let verified;
const verificationPromises = new Map();

class AuthError extends Error {
  constructor(message, status = 401) { super(message); this.status = status; this.name = 'AuthError'; }
}
class ConnectionError extends Error {
  constructor(message = '通信を確認できません。入力内容はそのままに、接続をご確認ください。') { super(message); this.status = 503; this.name = 'ConnectionError'; }
}
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { request.result.createObjectStore(STORE_NAME); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(Error('ブラウザの保存機能を利用できません。通常のウィンドウで開き直してください。'));
    request.onblocked = () => reject(Error('ブラウザの保存機能を準備できません。ほかの評価画面を閉じて開き直してください。'));
  });
}
async function readRecord() {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get('current');
    let value;
    request.onsuccess = () => { value = request.result; };
    transaction.oncomplete = () => { database.close(); resolve(value || { generation: null, session: null }); };
    transaction.onerror = () => { database.close(); reject(Error('ログイン状態を読み込めません。ページを開き直してください。')); };
  });
}
async function replaceRecord(session, expectedGeneration) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.get('current');
    let result;
    request.onsuccess = () => {
      const previous = request.result || { generation: null, session: null };
      if (expectedGeneration !== undefined && previous.generation !== expectedGeneration) {
        result = { applied: false, previous }; return;
      }
      const record = { generation: crypto.randomUUID(), session };
      objectStore.put(record, 'current');
      result = { applied: true, record, previous };
    };
    transaction.oncomplete = () => { database.close(); verified = undefined; resolve(result); };
    transaction.onerror = () => { database.close(); reject(Error('ログイン状態を保存できません。ブラウザの保存設定をご確認ください。')); };
  });
}
function normalizedSession(value) {
  if (!value || typeof value.access_token !== 'string' || typeof value.refresh_token !== 'string') throw Error('ログイン情報を確認できません。');
  const expiresAt = Number(value.expires_at) || Math.floor(Date.now() / 1000) + Number(value.expires_in);
  if (!Number.isFinite(expiresAt)) throw Error('ログインの有効期限を確認できません。');
  return { access_token: value.access_token, refresh_token: value.refresh_token, expires_at: expiresAt };
}
async function fetchWithTimeout(url, options = {}, milliseconds = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), milliseconds);
  try { return await fetch(url, { ...options, credentials: 'omit', cache: 'no-store', redirect: 'error', signal: controller.signal }); }
  catch { throw new ConnectionError(); }
  finally { clearTimeout(timeout); }
}
async function allWindows() {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  return clients.filter(client => {
    try { const url = new URL(client.url); return url.origin === ROOT_URL.origin && url.pathname.startsWith(ROOT); }
    catch { return false; }
  });
}
async function announce(message) { for (const client of await allWindows()) client.postMessage(message); }
async function clearPrivateCaches() {
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith('setsubigiken-cms-production-private-')).map(name => caches.delete(name)));
}
async function invalidate(record, status) {
  const result = await replaceRecord(null, record.generation);
  if (result.applied) {
    await clearPrivateCaches().catch(() => {});
    await announce({ type: 'cms-production-auth-required', reason: status === 403 ? 'denied' : 'expired' });
  }
}
async function verifyAccess(session) {
  const response = await fetchWithTimeout(SB + '/functions/v1/' + CONFIG.apiFunction + '/session', {
    headers: { apikey: CONFIG.publishableKey, Authorization: 'Bearer ' + session.access_token }
  });
  if (response.status === 401 || response.status === 403) throw new AuthError(response.status === 403 ? 'この評価用CMSを操作する権限がありません。' : 'ログインの期限が切れました。入口でログインし直してください。', response.status);
  if (!response.ok) throw new ConnectionError();
  let result;
  try { result = await response.json(); } catch { throw new ConnectionError(); }
  if (result.authenticated !== true || !['admin', 'editor', 'reviewer'].includes(result.permission)) throw new AuthError('この評価用CMSの利用権限を確認できません。', 403);
  return { permission: result.permission };
}
async function refreshRecord(record) {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetchWithTimeout(SB + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST', headers: { apikey: CONFIG.publishableKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: record.session.refresh_token })
      });
      if ([400, 401, 403].includes(response.status)) {
        await invalidate(record, 401);
        throw new AuthError('ログインの期限が切れました。入口でログインし直してください。');
      }
      if (!response.ok) throw new ConnectionError();
      const session = normalizedSession(await response.json());
      const result = await replaceRecord(session, record.generation);
      if (!result.applied) throw new AuthError('ログイン状態が変わりました。入口で確認してください。');
      return result.record;
    })().finally(() => { refreshPromise = undefined; });
  }
  return refreshPromise;
}
async function ensureSession(forceVerification = false) {
  let record = await readRecord();
  if (!record.session?.access_token) throw new AuthError('ログインが必要です。');
  if (record.session.expires_at * 1000 < Date.now() + 60000) record = await refreshRecord(record);
  if (!forceVerification && verified?.generation === record.generation && Date.now() - verified.at < 20000) return { ...record, permission: verified.permission };
  if (!verificationPromises.has(record.generation)) {
    const promise = (async () => {
      try {
        const access = await verifyAccess(record.session);
        const current = await readRecord();
        if (current.generation !== record.generation || !current.session) throw new AuthError('ログイン状態が変わりました。入口で確認してください。');
        verified = { generation: record.generation, at: Date.now(), permission: access.permission };
        return { ...record, permission: access.permission };
      } catch (error) {
        if (error instanceof AuthError) await invalidate(record, error.status);
        throw error;
      }
    })().finally(() => verificationPromises.delete(record.generation));
    verificationPromises.set(record.generation, promise);
  }
  return verificationPromises.get(record.generation);
}
async function login(password) {
  if (typeof password !== 'string' || !password || password.length > 1024) throw Error('評価用パスワードを入力してください。');
  const before = await readRecord();
  const response = await fetchWithTimeout(SB + '/auth/v1/token?grant_type=password', {
    method: 'POST', headers: { apikey: CONFIG.publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CONFIG.evaluationEmail, password })
  });
  if (response.status === 429) throw Error('ログインの試行が続いています。少し時間をおいてお試しください。');
  if ([400, 401, 403, 422].includes(response.status)) throw Error('ログインできませんでした。パスワードをご確認ください。');
  if (!response.ok) throw new ConnectionError();
  const session = normalizedSession(await response.json());
  const access = await verifyAccess(session);
  const result = await replaceRecord(session, before.generation);
  if (!result.applied) {
    await fetchWithTimeout(SB + '/auth/v1/logout?scope=local', {
      method: 'POST', headers: { apikey: CONFIG.publishableKey, Authorization: 'Bearer ' + session.access_token }
    }, 8000).catch(() => {});
    throw Error('別の画面でログイン状態が変わりました。もう一度ログインしてください。');
  }
  verified = { generation: result.record.generation, at: Date.now(), permission: access.permission };
  await announce({ type: 'cms-production-logged-in' });
  return { loggedIn: true, permission: access.permission };
}
async function logout() {
  const result = await replaceRecord(null);
  await clearPrivateCaches().catch(() => {});
  await announce({ type: 'cms-production-logged-out' });
  const destination = new URL('?loggedOut=1', ROOT_URL).href;
  const windows = await allWindows();
  await Promise.allSettled(windows.filter(client => ['app/', 'preview/'].some(prefix => new URL(client.url).pathname.startsWith(ROOT + prefix))).map(client => client.navigate(destination)));
  let serverRevoked = true;
  if (result.previous.session?.access_token) {
    try {
      const response = await fetchWithTimeout(SB + '/auth/v1/logout?scope=local', {
        method: 'POST', headers: { apikey: CONFIG.publishableKey, Authorization: 'Bearer ' + result.previous.session.access_token }
      }, 12000);
      serverRevoked = response.ok || response.status === 401 || response.status === 403;
    } catch { serverRevoked = false; }
  }
  return { loggedIn: false, serverRevoked };
}
async function signedFetch(url, record, options = {}, timeout = 45000) {
  const headers = new Headers(options.headers);
  headers.set('apikey', CONFIG.publishableKey);
  headers.set('Authorization', 'Bearer ' + record.session.access_token);
  return fetchWithTimeout(url, { ...options, headers }, timeout);
}
function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow, noarchive' }
  });
}
function loginRedirect(request) {
  const url = new URL(request.url);
  const destination = new URL(ROOT_URL);
  const next = CMS_REVIEW_ROUTING.safeReturnURL(url.href, ROOT_URL);
  if (next) destination.searchParams.set('next', next.pathname + next.search);
  return Response.redirect(destination.href, 302);
}
async function serve(request) {
  const route = CMS_REVIEW_ROUTING.parsePrivateURL(request.url, ROOT_URL);
  if (!route) return jsonError('このページは開けません。評価入口から選び直してください。', 403);
  let record;
  try {
    record = await ensureSession(request.mode === 'navigate');
    if (route.path.startsWith('__training/')) {
      if (!['GET', 'HEAD', 'POST'].includes(request.method)) return jsonError('この操作は利用できません。', 405);
      const headers = new Headers();
      for (const name of ['content-type', 'x-section-key', 'x-file-name']) if (request.headers.has(name)) headers.set(name, request.headers.get(name));
      const action = route.path.slice('__training/'.length);
      const response = await signedFetch(SB + '/functions/v1/' + CONFIG.apiFunction + '/' + route.app + '/' + action + route.url.search, record, {
        method: request.method === 'HEAD' ? 'GET' : request.method, headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer()
      });
      if (response.status === 401 || response.status === 403) {
        await invalidate(record, response.status);
        return jsonError(response.status === 403 ? 'この操作を行う権限がありません。入力内容は残しています。' : 'ログインの期限が切れました。入力内容を残したまま、評価入口でログインし直してください。', response.status);
      }
      const responseHeaders = new Headers({ 'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      if (response.headers.has('Retry-After')) responseHeaders.set('Retry-After', response.headers.get('Retry-After'));
      return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, headers: responseHeaders });
    }
    if (!['GET', 'HEAD'].includes(request.method)) return jsonError('評価環境では、応募フォームの送信は停止しています。', 405);
    const headers = new Headers();
    if (request.headers.has('Range')) headers.set('Range', request.headers.get('Range'));
    const options = { method: request.method, headers };
    let response;
    if (route.path.startsWith('training-data/production-media/')) {
      const id = route.path.slice('training-data/production-media/'.length);
      if (!/^[a-f0-9-]{32,64}(?:\.[a-z0-9]{2,5})?$/.test(id)) return jsonError('画像を確認してください。', 400);
      response = await signedFetch(SB + '/functions/v1/' + CONFIG.apiFunction + '/media/' + id, record, {...options, method:'GET'});
    } else if (route.app === 'taira' && route.path === 'sections/section-04/index.js') {
      // One fixed private module; no asset name, query, range or body is forwarded.
      // HEAD reuses this small authenticated GET and omits its body below.
      response = await signedFetch(SB + '/functions/v1/cms-evaluation-api/taira/section-04-module', record, { method: 'GET' });
    } else {
      if (route.path.startsWith('training-data/media/')) {
        const mediaPath = route.app + '/' + route.path.slice('training-data/media/'.length);
        response = await signedFetch(SB + '/storage/v1/object/authenticated/cms-eval-media/' + mediaPath.split('/').map(encodeURIComponent).join('/'), record, options);
      }
      if (!response || response.status === 400 || response.status === 404) {
        const codePath = route.app + '/' + CONFIG.apps[route.app].release + '/' + route.path;
        response = await signedFetch(SB + '/storage/v1/object/authenticated/cms-eval-code/' + codePath.split('/').map(encodeURIComponent).join('/'), record, options);
      }
    }
    if (response.status === 401 || response.status === 403) {
      await invalidate(record, response.status);
      if (request.mode === 'navigate') return loginRedirect(request);
      return jsonError('ログイン状態または閲覧権限を確認してください。', response.status);
    }
    if (!response.ok) return jsonError(response.status === 404 ? '指定されたファイルが見つかりません。評価入口から開き直してください。' : 'ファイルを読み込めません。通信状態をご確認ください。', response.status);
    const extension = route.path.split('.').at(-1).toLowerCase();
    if (route.path.startsWith('training-data/production-media/')) {
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-store');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
      return new Response(request.method === 'HEAD' ? null : response.body, {status:response.status,headers});
    }

    const responseHeaders = new Headers({
      'Content-Type': MIME[extension] || 'application/octet-stream', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow, noarchive'
    });
    for (const name of ['Content-Range', 'Accept-Ranges']) if (response.headers.has(name)) responseHeaders.set(name, response.headers.get(name));
    if (extension === 'html') responseHeaders.set('Content-Security-Policy', PRIVATE_CSP);
    const body = request.method === 'HEAD' ? null : ['html', 'js', 'mjs', 'css', 'json'].includes(extension)
      ? CMS_RUNTIME_TRANSFORM.adapt(await response.text(), route, ROOT_URL)
      : response.body;
    return new Response(body, { status: response.status, headers: responseHeaders });
  } catch (error) {
    if (error instanceof AuthError && request.mode === 'navigate') return loginRedirect(request);
    return jsonError(error instanceof AuthError ? error.message : '通信を確認できません。入力内容はそのままに、接続をご確認ください。', error.status || 503);
  }
}

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async () => { await clearPrivateCaches().catch(() => {}); await self.clients.claim(); })()));
self.addEventListener('message', event => {
  if (!event.ports?.[0]) return;
  let source;
  try { source = new URL(event.source.url); } catch { return; }
  if (source.origin !== ROOT_URL.origin || !source.pathname.startsWith(ROOT)) return;
  event.waitUntil((async () => {
    try {
      const { type, value } = event.data || {};
      let result;
      if (type === 'login') result = await login(value?.password);
      else if (type === 'logout') result = await logout();
      else if (type === 'status') {
        try { const record = await ensureSession(true); result = { loggedIn: true, permission: record.permission }; }
        catch (error) { if (error instanceof AuthError) result = { loggedIn: false }; else throw error; }
      } else throw Error('この操作は利用できません。');
      event.ports[0].postMessage(result);
    } catch (error) { event.ports[0].postMessage({ error: error.message || '接続を確認できません。' }); }
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== ROOT_URL.origin) return;
  if (url.pathname.startsWith(ROOT + 'app/')) event.respondWith(serve(event.request));
  else if (url.pathname.startsWith(ROOT + 'preview/') || url.pathname.startsWith(ROOT + '__site/')) event.respondWith(serveSharedPreview(event.request));
});


const CMS_PUBLIC_PREVIEW_FILES = Object.freeze(["app.js", "assets/send-paper-plane.png", "config.js", "index.html", "sections/section-01/index.js", "sections/section-01/style.css", "sections/section-02/index.js", "sections/section-02/style.css", "sections/section-03/index.js", "sections/section-03/style.css", "sections/section-04/index.js", "sections/section-04/style.css", "sections/section-05/index.js", "sections/section-05/style.css", "sections/section-06/index.js", "sections/section-06/style.css", "sections/section-07/index.js", "sections/section-07/style.css", "sections/section-08/index.js", "sections/section-08/style.css", "sections/section-09/index.js", "sections/section-09/style.css", "sections/section-10/index.js", "sections/section-10/style.css", "sections/section-11/index.js", "sections/section-11/style.css", "sections/section-12/index.js", "sections/section-12/style.css", "shared/base.css", "shared/cms-tuning-config.js", "shared/cms-visual.js", "shared/form-guard.js", "shared/html.js", "shared/legacy-media.js", "shared/media-tuning.js", "shared/safety.js", "shared/v2-display.js", "site.css"]);
/* Display-only shared preview. This code never supplies editor source to a public route. */
async function serveSharedPreview(request) {
  if (!['GET', 'HEAD'].includes(request.method)) return jsonError('応募フォームの実送信は停止しています。', 405);
  const url = new URL(request.url);
  const privateHeaders = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer'};
  try {
    const record = await ensureSession(request.mode === 'navigate');
    let response;
    let htmlDocument = false;
    if (url.pathname.startsWith(ROOT + '__site/')) {
      const path = url.pathname.slice((ROOT + '__site/').length);
      if (path === 'state') {
        response = await signedFetch(SB + '/functions/v1/' + CONFIG.apiFunction + '/gibo/site-preview', record);
        if (response.status === 401 || response.status === 403) await invalidate(record,response.status);
        if (!response.ok) return jsonError('共通サイトの内容を確認できません。', response.status);
        let data = await response.json();
        // Private preview assets are resolved through this same authenticated gateway.
        const prefix = new URL('__site/media/', ROOT_URL).href;
        function rewrite(value) {
          if (typeof value === 'string') {
            const match = value.match(/^(?:\.\/)?training-data\/production-media\/([a-f0-9-]{32,64}(?:\.[a-z0-9]{2,5})?)$/);
            return match ? prefix + match[1] : value;
          }
          if (Array.isArray(value)) return value.map(rewrite);
          if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[rewrite(k),rewrite(v)]));
          return value;
        }
        return new Response(request.method === 'HEAD' ? null : JSON.stringify(rewrite(data)), {headers:{...privateHeaders,'Content-Type':'application/json; charset=utf-8'}});
      }
      const match = path.match(/^media\/([a-f0-9-]{32,64}(?:\.[a-z0-9]{2,5})?)$/);
      if (!match) return jsonError('この表示には対応していません。', 404);
      response = await signedFetch(SB + '/functions/v1/' + CONFIG.apiFunction + '/media/' + match[1], record, {method:'GET'});
    } else {
      let path = url.pathname.slice((ROOT + 'preview/').length) || 'index.html';
      if (!/^[A-Za-z0-9_./-]+\.(?:html|js|mjs|css|svg|png|jpg|webp|ico)$/.test(path) || path.split('/').some(p=>!p || p.startsWith('.'))) return jsonError('このページは確認できません。', 404);
      if (!CMS_PUBLIC_PREVIEW_FILES.includes(path)) return jsonError('このページは確認できません。', 404);
      htmlDocument = path.endsWith('.html');
      if (path === 'config.js') {
        const endpoint = new URL('__site/', ROOT_URL).href;
        return new Response(request.method === 'HEAD' ? null : `export const SITE_CONFIG=Object.freeze({apiBase:${JSON.stringify(endpoint.replace(/\/$/,''))},sitePath:'/state',mediaBase:${JSON.stringify(endpoint+'media/')},preview:true,loginUrl:${JSON.stringify(ROOT_URL.href)}});`, {headers:{...privateHeaders,'Content-Type':'text/javascript; charset=utf-8'}});
      }
      const source = new URL(CONFIG.publicSite, ROOT_URL);
      response = await fetchWithTimeout(new URL(path, source).href);
    }
    if (response.status === 401 || response.status === 403) {
      await invalidate(record, response.status);
      return jsonError('ログインの確認が必要です。', response.status);
    }
    const headers = new Headers(response.headers);
    for (const [key,value] of Object.entries(privateHeaders)) headers.set(key,value);
    if (htmlDocument) headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://d8j0ntlcm91z4.cloudfront.net; media-src 'self' blob:; font-src 'self' data:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'self'");
    return new Response(request.method === 'HEAD' ? null : response.body,{status:response.status,headers});
  } catch (error) {
    if (error instanceof AuthError && request.mode === 'navigate') return Response.redirect(ROOT_URL.href,302);
    return jsonError(error instanceof AuthError ? error.message : '表示を読み込めません。接続状態を確認してください。', error.status||503);
  }
}
