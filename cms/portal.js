'use strict';
const BASE = new URL('./', document.currentScript.src);
const config = CMS_REVIEW_CONFIG;
document.querySelector('#publicSiteLink').href = new URL(config.publicSite, BASE).href;
const password = document.querySelector('#password');
const loginButton = document.querySelector('#loginBtn');
const retryButton = document.querySelector('#retryBtn');
const message = document.querySelector('#message');
let worker;
let checking;
let loggingIn = false;
let isReady = false;

function notice(text, level = 'info', retry = false) {
  message.textContent = text;
  message.dataset.level = level;
  retryButton.hidden = !retry;
}
function ready(value, focus = false) {
  isReady = value;
  document.querySelector('#login').hidden = value;
  document.querySelector('#ready').hidden = !value;
  if (focus) (value ? document.querySelector('#workspace-title') : password).focus();
}
function rpc(type, value) {
  return new Promise((resolve, reject) => {
    if (!worker) { reject(Error('接続を準備できませんでした。ページを開き直してください。')); return; }
    const channel = new MessageChannel();
    const timer = setTimeout(() => {
      channel.port1.close();
      reject(Error('接続を確認できません。通信状態をご確認ください。'));
    }, type === 'login' ? 45000 : 25000);
    channel.port1.onmessage = event => {
      clearTimeout(timer);
      channel.port1.close();
      event.data?.error ? reject(Error(event.data.error)) : resolve(event.data);
    };
    worker.postMessage({ type, value }, [channel.port2]);
  });
}
function forward() {
  const next = CMS_REVIEW_ROUTING.safeReturnURL(new URL(location.href).searchParams.get('next'), BASE);
  if (next) { location.replace(next.href); return true; }
  return false;
}
async function checkSession() {
  if (checking || loggingIn) return checking;
  checking = (async () => {
    try {
      const state = await rpc('status');
      ready(state.loggedIn);
      if (state.loggedIn) {
        notice('');
        forward();
      } else if (new URL(location.href).searchParams.has('loggedOut')) {
        notice('ログアウトしました。');
      } else {
        notice('');
      }
    } catch (error) {
      notice(error.message, 'error', true);
    }
  })().finally(() => { checking = undefined; });
  return checking;
}
async function boot() {
  if (!window.isSecureContext || !('serviceWorker' in navigator)) {
    throw Error('最新版のChrome・Edge・Safariで、案内されたURLを開いてください。');
  }
  const expectedScript = new URL('sw.js', BASE).href;
  await navigator.serviceWorker.register(expectedScript, { scope: BASE.pathname, updateViaCache: 'none' });
  if (navigator.serviceWorker.controller?.scriptURL !== expectedScript) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { navigator.serviceWorker.removeEventListener('controllerchange', changed); reject(Error('画面を準備できませんでした。ページを開き直してください。')); }, 15000);
      function changed() {
        if (navigator.serviceWorker.controller?.scriptURL === expectedScript) {
          clearTimeout(timer);
          navigator.serviceWorker.removeEventListener('controllerchange', changed);
          resolve();
        }
      }
      navigator.serviceWorker.addEventListener('controllerchange', changed);
      changed();
    });
  }
  worker = navigator.serviceWorker.controller;
  password.disabled = false;
  loginButton.disabled = false;
  await checkSession();
}

for (const link of document.querySelectorAll('[data-app][data-destination]')) {
  const app = link.dataset.app;
  const destination = link.dataset.destination;
  link.href = destination === 'site' ? new URL('preview/index.html', BASE).href : new URL('app/' + app + '/' + config.apps[app][destination], BASE).href;
}
document.querySelector('#loginForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (loggingIn || loginButton.disabled || !password.value) return;
  loggingIn = true;
  loginButton.disabled = true;
  loginButton.textContent = '確認しています…';
  notice('ログインを確認しています…');
  try {
    await rpc('login', { password: password.value });
    password.value = '';
    notice('');
    ready(true, true);
    forward();
  } catch (error) {
    ready(false);
    notice(error.message, 'error');
    password.focus();
  } finally {
    loggingIn = false;
    loginButton.disabled = false;
    loginButton.textContent = 'ログイン';
  }
});
document.querySelector('#logoutBtn').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const result = await rpc('logout');
    ready(false, true);
    notice(result.serverRevoked === false ? 'このブラウザではログアウトしました。通信の問題により、接続先の終了処理は確認できていません。' : 'ログアウトしました。');
  } catch (error) { notice(error.message, 'error', true); }
  finally { button.disabled = false; }
});
retryButton.addEventListener('click', () => worker ? checkSession() : location.reload());
navigator.serviceWorker?.addEventListener('controllerchange', () => { worker = navigator.serviceWorker.controller; });
navigator.serviceWorker?.addEventListener('message', event => {
  if (event.data?.type === 'cms-production-logged-out' || event.data?.type === 'cms-production-auth-required') {
    ready(false);
    notice(event.data.type === 'cms-production-logged-out' ? 'ログアウトしました。' : 'ログインの期限、または利用権限を確認してください。', event.data.type === 'cms-production-logged-out' ? 'info' : 'error');
  } else if (event.data?.type === 'cms-production-logged-in' && !loggingIn) {
    checkSession();
  }
});
window.addEventListener('focus', () => { if (worker) checkSession(); });
window.addEventListener('online', () => { if (worker) checkSession(); });
window.addEventListener('offline', () => { notice('通信が切れています。接続が戻ってから、もう一度お試しください。', 'error', true); });
setInterval(() => { if (worker && isReady && !document.hidden) checkSession(); }, 30000);
boot().catch(error => { notice(error.message, 'error', true); });

