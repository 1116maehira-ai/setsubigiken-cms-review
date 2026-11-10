import { visualHelpers } from "../../shared/cms-visual.js";
export const sectionKey = "section-04";
function escapeHtml(v=""){return String(v).replace(/[&<>'"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}
function lines(v=""){return escapeHtml(v).replace(/\n/g,"<br>");}
function safeAsset(v=""){return String(v||"");}
function pct(v,d=50){const n=Number(v);return `${Number.isFinite(n)?n:d}%`;}
function num(v,d=1){const n=Number(v);return Number.isFinite(n)?n:d;}
function styleVars(style={}){
  const d=style.desktop||{}, m=style.mobile||{};
  const out=[
    `--title-x:${(Number(d.titleX)||0)}px`,`--title-y:${(Number(d.titleY)||0)}px`,
    `--bg-x:${pct(d.bgPhotoX,86)}`,`--bg-y:${pct(d.bgPhotoY,28)}`,`--bg-z:${num(d.bgPhotoZoom,1.18)}`,
    `--m-title-x:${(Number(m.titleX)||0)}px`,`--m-title-y:${(Number(m.titleY)||0)}px`,
    `--m-bg-x:${pct(m.bgPhotoX,72)}`,`--m-bg-y:${pct(m.bgPhotoY,18)}`,`--m-bg-z:${num(m.bgPhotoZoom,1.32)}`
  ];
  for(let i=1;i<=5;i++){
    out.push(`--photo${i}-x:${pct(d[`photo${i}X`],50)}`);
    out.push(`--photo${i}-y:${pct(d[`photo${i}Y`],50)}`);
    out.push(`--photo${i}-z:${num(d[`photo${i}Zoom`],1)}`);
    out.push(`--m-photo${i}-x:${pct(m[`photo${i}X`],50)}`);
    out.push(`--m-photo${i}-y:${pct(m[`photo${i}Y`],50)}`);
    out.push(`--m-photo${i}-z:${num(m[`photo${i}Zoom`],1)}`);
  }
  return out.join(';');
}
export function render(mount,data){
  const c=data.content||{};
  const jobs=Array.isArray(c.jobs)?c.jobs:[];
  const center=c.center||{};
  const {T,I}=visualHelpers(data);
  mount.innerHTML=`<section class="s04" id="section04" style="${styleVars(data.style)}">
    <div class="s04-bg-photo"${I('content.backgroundImage')} aria-hidden="true"><img src="${safeAsset(c.backgroundImage)}" alt=""></div>
    <div class="s04-ornament" aria-hidden="true"></div>
    <div class="inner s04-inner">
      <header class="s04-head">
        <div class="s04-label"><span class="cms-t"${T('content.label')}>${escapeHtml(c.label||'SECTION 04')}</span> <span>｜</span> <span class="cms-t"${T('content.labelText')}>${escapeHtml(c.labelText||'仕事紹介')}</span></div>
        <h2${T('content.title')}>${escapeHtml(c.title||'どんな仕事をするの？')}</h2>
        <div class="s04-rule"></div>
      </header>
      <div class="s04-grid">
        ${jobs.map((job,i)=>`<article class="s04-card s04-card--job s04-card--${i+1}">
          <div class="s04-copy">
            <div class="s04-card-title"><img${I(`content.jobs.${i}.icon`)} src="${safeAsset(job.icon)}" alt=""><h3><span${T(`content.jobs.${i}.department`)}>${escapeHtml(job.department||'')}</span>｜<span${T(`content.jobs.${i}.title`)}>${escapeHtml(job.title||'')}</span></h3></div>
            <p${T(`content.jobs.${i}.body`)}>${lines(job.body||'')}</p>
          </div>
          <div class="s04-photo"${I(`content.jobs.${i}.image`)}><img src="${safeAsset(job.image)}" alt="${escapeHtml(job.imageAlt||'')}"></div>
        </article>`).join('')}
        <article class="s04-card s04-card--wide s04-card--5">
          <div class="s04-copy">
            <div class="s04-card-title"><img${I('content.center.icon')} src="${safeAsset(center.icon)}" alt=""><h3${T('content.center.title')}>${escapeHtml(center.title||'')}</h3></div>
            <p${T('content.center.body')}>${lines(center.body||'')}</p>
          </div>
          <div class="s04-photo"${I('content.center.image')}><img src="${safeAsset(center.image)}" alt="${escapeHtml(center.imageAlt||'')}"></div>
        </article>
      </div>
    </div>
  </section>`;
}
