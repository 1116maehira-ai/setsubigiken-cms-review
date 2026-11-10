
import { visualHelpers, media, VIDEO_OK } from "../../shared/cms-visual.js";
export const sectionKey = "section-06";
const E=v=>String(v??"").replace(/[&<>'"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[m]));
const L=v=>E(v).replace(/\n/g,"<br>");
function styleVars(s={}){const d=s.desktop||{},m=s.mobile||{};return [
`--hero-x:${Number(d.heroX)||72}%`,`--hero-y:${Number(d.heroY)||42}%`,`--hero-z:${Number(d.heroZoom)||1}`,
`--m-hero-x:${Number(m.heroX)||68}%`,`--m-hero-y:${Number(m.heroY)||44}%`,`--m-hero-z:${Number(m.heroZoom)||1.05}`
].join(";")}
export function render(mount,data){
  const c=data.content||{}, voices=Array.isArray(c.voices)?c.voices:[];
  const {T,I}=visualHelpers(data);
  mount.innerHTML=`<section class="s06" style="${styleVars(data.style)}">
    <div class="s06-hero">
      ${media(c.heroImage,{cls:"s06-hero-img",attrs:I("content.heroImage")+VIDEO_OK})}
      <div class="inner s06-hero-inner">
        <div class="s06-title"><div class="s06-label"${T("content.label")}>${E(c.label||"SECTION 06")}</div><h2${T("content.title")}>${L(c.title||"")}</h2><span></span></div>
        <div class="s06-note"${T("content.note")}>${L(c.note||"")}</div>
      </div>
    </div>
    <div class="s06-body">
      <div class="s06-geo s06-geo-a"></div><div class="s06-geo s06-geo-b"></div><div class="s06-dots-bg"></div>
      <div class="inner s06-main">
        <div class="s06-carousel-shell">
          <button class="s06-nav s06-prev" aria-label="前へ"><span>‹</span></button>
          <div class="s06-stage-wrap">
            <div class="s06-stage" aria-live="polite"></div>
          </div>
          <button class="s06-nav s06-next" aria-label="次へ"><span>›</span></button>
        </div>
        <div class="s06-thumbs-wrap">
          <div class="s06-thumbs">${voices.map((v,i)=>`<button data-thumb="${i}" aria-label="${E(v.name||`Voice ${i+1}`)}"><img src="${E(v.image)}" alt=""></button>`).join("")}</div>
        </div>
        <div class="s06-meta-nav">
          <div class="s06-pager">${voices.map((_,i)=>`<i data-dot="${i}"></i>`).join("")}</div>
          <div class="s06-count"><b>01</b><span>/</span><em>${String(voices.length).padStart(2,"0")}</em></div>
        </div>
        <div class="s06-script"><span class="s06-script-text"${T("content.scriptText")}>${E(c.scriptText||"Voice")}</span></div>
      </div>
    </div>
  </section>`;

  if(!voices.length) return;

  let page=0, animating=false, touchStartX=null;
  const stage=mount.querySelector(".s06-stage");
  const stageWrap=mount.querySelector(".s06-stage-wrap");
  const thumbsWrap=mount.querySelector(".s06-thumbs-wrap");
  const thumbs=[...mount.querySelectorAll("[data-thumb]")];
  const dots=[...mount.querySelectorAll("[data-dot]")];
  const countNow=mount.querySelector(".s06-count b");

  function card(v,index){
    return `<article class="s06-card" data-cms-card-index="${index}" data-cms-item="content.voices.${index}" data-cms-item-label="先輩の声">
      <div class="s06-card-top">
        <div class="s06-photo"><img${I(`content.voices.${index}.image`)} src="${E(v.image)}" alt=""></div>
        <div class="s06-card-head"><small><span${T(`content.voices.${index}.dept`)}>${E(v.dept)}</span>　<span${T(`content.voices.${index}.year`)}>${E(v.year)}</span></small><h3${T(`content.voices.${index}.name`)}>${E(v.name)}</h3><h4${T(`content.voices.${index}.quote`)}>${L(v.quote)}</h4></div>
      </div>
      <p${T(`content.voices.${index}.body`)}>${L(v.body)}</p><div class="s06-more"><em class="s06-more-label"${T("content.moreLabel")}>${E(c.moreLabel||"詳しく見る")}</em> <span>→</span></div>
    </article>`
  }

  function syncNav(){
    thumbs.forEach((x,i)=>x.classList.toggle("active",i===page));
    dots.forEach((x,i)=>x.classList.toggle("active",i===page));
    countNow.textContent=String(page+1).padStart(2,"0");
    const active=thumbs[page];
const thumbsEl=mount.querySelector(".s06-thumbs");
if(active && thumbsEl && thumbsEl.scrollWidth > thumbsEl.clientWidth){
  const left=active.offsetLeft-(thumbsEl.clientWidth-active.offsetWidth)/2;
  thumbsEl.scrollTo({left,behavior:"smooth"});
}
  }

  function renderCards(){
    stage.innerHTML=card(voices[page],page)+card(voices[(page+1)%voices.length],(page+1)%voices.length);
    syncNav();
  }

  function go(next,direction=1){
    if(animating || next===page) return;
    animating=true;
    stage.classList.remove("slide-in-left","slide-in-right");
    stage.classList.add(direction>0?"slide-out-left":"slide-out-right");
    setTimeout(()=>{
      page=(next+voices.length)%voices.length;
      stage.classList.remove("slide-out-left","slide-out-right");
      renderCards();
      stage.classList.add(direction>0?"slide-in-right":"slide-in-left");
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        stage.classList.remove("slide-in-right","slide-in-left");
        animating=false;
      }));
    },210);
  }

  mount.querySelector(".s06-prev").onclick=()=>go(page-1,-1);
  mount.querySelector(".s06-next").onclick=()=>go(page+1,1);
  thumbs.forEach((x,i)=>x.onclick=()=>go(i,i>page?1:-1));

  stageWrap.addEventListener("pointerdown",e=>{
    touchStartX=e.clientX;
    stageWrap.setPointerCapture?.(e.pointerId);
  });
  stageWrap.addEventListener("pointerup",e=>{
    if(touchStartX===null) return;
    const dx=e.clientX-touchStartX; touchStartX=null;
    if(Math.abs(dx)>55) go(page+(dx<0?1:-1),dx<0?1:-1);
  });
  stageWrap.addEventListener("pointercancel",()=>touchStartX=null);

  renderCards();

  // カードの高さを、全員分のうち一番高いカードにそろえる。
  // 本文の長さでカードの高さが変わると、送るたびに左右の矢印（上下中央に置いている）や
  // 下の小さい写真の位置が動いてしまうため。画面幅が変わったとき・文字の読み込み後に測り直す。
  function equalizeHeight(){
    const probe=document.createElement("div");
    probe.className="s06-stage";
    probe.setAttribute("aria-hidden","true");
    probe.style.cssText="position:absolute;left:2px;right:2px;top:0;visibility:hidden;pointer-events:none;transition:none;min-height:0";
    probe.innerHTML=voices.map((v,i)=>card(v,i)).join("");
    stageWrap.appendChild(probe);
    const max=Math.max(0,...[...probe.querySelectorAll(".s06-card")].map(c=>c.getBoundingClientRect().height));
    probe.remove();
    stage.style.minHeight=max?`${Math.ceil(max)}px`:"";
    // カードの白い枠も一番背の高いカードにそろえる（文章が短い先輩でも、枠の外に空白が残らないように）
    if(max) stage.style.setProperty("--s06-card-h",`${Math.ceil(max)}px`); else stage.style.removeProperty("--s06-card-h");
  }
  stageWrap.style.position="relative";
  equalizeHeight();
  if(mount.__s06ResizeObserver) mount.__s06ResizeObserver.disconnect();
  let lastWidth=stageWrap.clientWidth;
  const ro=new ResizeObserver(()=>{ if(stageWrap.clientWidth!==lastWidth){ lastWidth=stageWrap.clientWidth; equalizeHeight(); } });
  ro.observe(stageWrap);
  mount.__s06ResizeObserver=ro;
  document.fonts?.ready?.then(()=>{ if(stageWrap.isConnected) equalizeHeight(); });
}
