import { SITE_CONFIG } from './config.js';
import { apiUrl, prepareSite, normalizeMedia } from './shared/safety.js';
import { applyCmsTuning } from './shared/html.js';
import { installApplicationGuard, stopApplications } from './shared/form-guard.js';

installApplicationGuard();
const mount = document.getElementById('app');
const status = document.getElementById('site-status');
let generation=0, requestController=null;
const preview=SITE_CONFIG.preview===true;

function clearPreview(message='採用サイトを読み込んでいます。') {
  generation++;requestController?.abort();
  for(const section of mount.children){
    section.__cmsTuningObserver?.disconnect();section.__s06ResizeObserver?.disconnect();
    if(section.__cmsTuningMediaHandler)window.matchMedia('(max-width: 760px)').removeEventListener?.('change',section.__cmsTuningMediaHandler);
  }
  mount.replaceChildren();mount.hidden=true;delete mount.dataset.siteRevision;
  document.title='設備技研 採用サイト';
  for(const meta of document.head.querySelectorAll('meta[property^="og:"],meta[name="description"]'))meta.remove();
  status.hidden=false;status.textContent=message;status.setAttribute('role','status');
  document.documentElement.dataset.siteReady='pending';
}

function requireLogin() {
  clearPreview('このプレビューを表示するには、入口からログインし直してください。');
  status.setAttribute('role','alert');
  const candidate=new URL(SITE_CONFIG.loginUrl || '../../',location.href);
  if(candidate.origin===location.origin){const a=document.createElement('a');a.href=candidate.href;a.textContent='ログイン画面へ';status.append(document.createTextNode(' '),a);}
  document.documentElement.dataset.siteReady='auth-required';
}

if(preview){
  window.addEventListener('pagehide',()=>clearPreview());
  window.addEventListener('pageshow',event=>{if(event.persisted){clearPreview();loadSite();}});
  navigator.serviceWorker?.addEventListener('message',event=>{
    if(['cms-production-logged-out','cms-production-auth-required'].includes(event.data?.type))requireLogin();
  });
}

function metadata(share = {}) {
  if (typeof share.title === 'string' && share.title.trim()) document.title=share.title.slice(0,200);
  const set=(name,value,property=false)=>{
    if (typeof value!=='string' || !value.trim()) return;
    let el=document.head.querySelector(`meta[${property?'property':'name'}="${name}"]`);
    if(!el){el=document.createElement('meta');el.setAttribute(property?'property':'name',name);document.head.append(el);} el.content=value.slice(0,1000);
  };
  set('description',share.description);set('og:title',document.title,true);set('og:description',share.description,true);
  const image=normalizeMedia(share.image);if(image)set('og:image',image,true);
  set('og:url',SITE_CONFIG.canonicalUrl,true);
  set('robots',preview || SITE_CONFIG.noindex !== false ? 'noindex, nofollow' : 'index, follow');
}

async function renderSite(site, expectedGeneration) {
  const entries=Object.entries(site.sections).filter(([,s])=>s.enabled).sort((a,b)=>a[1].sortOrder-b[1].sortOrder);
  const modules=await Promise.all(entries.map(async([key,data])=>({key,data,module:await import(`./sections/${key}/index.js`)})));
  if(expectedGeneration!==generation)return;
  const fragment=document.createDocumentFragment();
  for(const {key,data,module} of modules){
    const section=document.createElement('div');section.dataset.sectionMount=key;section.id=key;
    module.render(section,data);fragment.append(section);
  }
  mount.replaceChildren(fragment);
  mount.hidden=false;
  for(const {key,data} of modules)applyCmsTuning(mount.querySelector(`[data-section-mount="${key}"]`),data.style,key,data);
  stopApplications(mount);metadata(site.share);
  const anchors={'トップ':'section-01','会社情報':'section-08','募集要項':'section-07','よくある質問':'section-11','エントリー':'section-12','採用情報':'section-12'};
  for(const a of mount.querySelectorAll('footer a,.s12-footer a'))if(anchors[a.textContent.trim()])a.href='#'+anchors[a.textContent.trim()];
  mount.dataset.siteRevision=String(site.revision);document.documentElement.dataset.siteReady='true';status.hidden=true;
  if(location.hash){
    let id='';try{id=decodeURIComponent(location.hash.slice(1));}catch{}
    if(id&&id.length<200)requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView?.({behavior:'auto',block:'start'}));
  }
}

async function loadSite(){
  const serial=++generation;requestController?.abort();requestController=new AbortController();
  try{
    const response=await fetch(apiUrl(),{method:'GET',cache:'no-store',credentials:'omit',headers:{Accept:'application/json'},signal:requestController.signal});
    if(serial!==generation)return;
    if(preview&&[401,403].includes(response.status)){requireLogin();return;}
    if(!response.ok)throw new Error(response.status===503?'ただいま公開内容を確認しています。しばらくしてからお試しください。':'採用サイトを読み込めませんでした。時間をおいて再読み込みしてください。');
    const text=await response.text();if(serial!==generation)return;
    if(text.length>16*1024*1024)throw new Error('表示データを確認できませんでした。');
    await renderSite(prepareSite(JSON.parse(text)),serial);
  }catch(error){
    if(serial!==generation||error?.name==='AbortError')return;
    if(preview){mount.replaceChildren();mount.hidden=true;}
    status.hidden=false;status.textContent=error instanceof Error ? error.message : '採用サイトを読み込めませんでした。';
    status.setAttribute('role','alert');document.documentElement.dataset.siteReady='error';
  }
}
loadSite();
