import { textStyleAttr, cmsPath, cmsImagePath, media, VIDEO_OK } from "../../shared/cms-visual.js";
export const sectionKey = "section-05";
function escapeHtml(v=""){return String(v).replace(/[&<>'"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}
function lines(v=""){return escapeHtml(v).replace(/\n/g,"<br>");}
function safeAsset(v=""){return String(v||"");}
function pct(v,d=50){const n=Number(v);return `${Number.isFinite(n)?n:d}%`;}
function num(v,d=1){const n=Number(v);return Number.isFinite(n)?n:d;}

// 文字の装飾・ビジュアル編集の目印は、全セクション共通の shared/cms-visual.js に移しました（動作は以前と同じ）。

function styleVars(style={}){
  const d=style.desktop||{},m=style.mobile||{};
  return [
    `--title-x:${Number(d.titleX)||0}px`,`--title-y:${Number(d.titleY)||0}px`,
    `--bg-x:${pct(d.bgPhotoX,78)}`,`--bg-y:${pct(d.bgPhotoY,35)}`,`--bg-z:${num(d.bgPhotoZoom,1.12)}`,
    `--m-title-x:${Number(m.titleX)||0}px`,`--m-title-y:${Number(m.titleY)||0}px`,
    `--m-bg-x:${pct(m.bgPhotoX,70)}`,`--m-bg-y:${pct(m.bgPhotoY,22)}`,`--m-bg-z:${num(m.bgPhotoZoom,1.25)}`
  ].join(';');
}
export function render(mount,data){
  const c=data.content||{};
  const cols=Array.isArray(c.columns)?c.columns:[];
  const ed=!!data.__editor; // ビジュアル編集の画面だけ、空欄の説明文・写真の入れ物も作る
  mount.innerHTML=`<section class="s05" id="section05" style="${styleVars(data.style)}">
    <div class="s05-bg-photo"${cmsImagePath('content.backgroundImage')}${VIDEO_OK} aria-hidden="true">${media(safeAsset(c.backgroundImage))}</div>
    <div class="s05-ornament s05-ornament--left" aria-hidden="true"></div>
    <div class="s05-ornament s05-ornament--right" aria-hidden="true"></div>
    <div class="s05-angle s05-angle--left" aria-hidden="true"></div>
    <div class="s05-angle s05-angle--right" aria-hidden="true"></div>
    <div class="inner s05-inner">
      <header class="s05-head">
        <div class="s05-label"><span${textStyleAttr(c.labelStyle)}${cmsPath('content.label')}>${escapeHtml(c.label||'SECTION 05')}</span> <span>｜</span> <span${textStyleAttr(c.labelTextStyle)}${cmsPath('content.labelText')}>${escapeHtml(c.labelText||'1日の流れ')}</span></div>
        <h2${textStyleAttr(c.titleStyle)}${cmsPath('content.title')}>${escapeHtml(c.title||'')}</h2>
        <div class="s05-rule"></div>
      </header>
      <div class="s05-columns">${cols.map((col,ci)=>`<article class="s05-column"><div class="s05-column-head"${textStyleAttr(col.titleStyle)}${cmsPath(`content.columns.${ci}.title`)}>${escapeHtml(col.title||'')}</div><div class="s05-timeline">${(Array.isArray(col.items)?col.items:[]).map((item,ii)=>`<div class="s05-item"><div class="s05-time"${textStyleAttr(item.timeStyle)}${cmsPath(`content.columns.${ci}.items.${ii}.time`)}>${escapeHtml(item.time||'')}</div><div class="s05-item-body"><h3${textStyleAttr(item.titleStyle)}${cmsPath(`content.columns.${ci}.items.${ii}.title`)}>${escapeHtml(item.title||'')}</h3>${(item.body||ed)?`<p${textStyleAttr(item.bodyStyle)}${cmsPath(`content.columns.${ci}.items.${ii}.body`)}>${lines(item.body)}</p>`:''}</div><div class="s05-photo"${cmsImagePath(`content.columns.${ci}.items.${ii}.image`)}>${(item.image||ed)?`<img src="${safeAsset(item.image)}" alt="${escapeHtml(item.imageAlt||'')}">`:''}</div></div>`).join('')}</div></article>`).join('')}</div>
    </div>
  </section>`;
}
