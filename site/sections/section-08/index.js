import { escapeHtml, lines, safeAsset } from "../../shared/html.js";
import { visualHelpers, media, VIDEO_OK } from "../../shared/cms-visual.js";
export const sectionKey = "section-08";
const E=escapeHtml, L=lines, A=safeAsset;
export function render(mount,data){
  const d=data.content||{};
  const {T,I}=visualHelpers(data);
  const items=((d.history||{}).items||[]).map((item,i)=>`<div class="s08-row" data-cms-item="content.history.items.${i}" data-cms-item-label="沿革"><div class="s08-year"${T(`content.history.items.${i}.year`)}>${E(item.year||"")}</div><div class="s08-text"${T(`content.history.items.${i}.text`)}>${E(item.text||"")}</div></div>`).join("");
  mount.innerHTML=`<section class="s08"><div class="s08-bg-poly"></div><div class="inner"><div class="s08-grid"><div class="s08-left"><div class="s08-label"${T("content.meta.label")}>${E(d.meta?.label||"SECTION 08")}</div><h2 class="s08-title"${T("content.meta.title")}>${E(d.meta?.title||"")}</h2><div class="s08-title-bar"></div><div class="s08-headline"${T("content.meta.headline")}>${L(d.meta?.headline||"")}</div><div class="s08-dots"></div></div><div class="s08-main"><div class="s08-main-grid"><div><div class="s08-history-head"><img${I("content.history.icon")} src="${A(d.history?.icon)}" alt=""><h3${T("content.history.heading")}>${E(d.history?.heading||"")}</h3></div><div class="s08-timeline">${items}</div></div><div class="s08-photo-wrap"><div class="s08-photo-card" style="--photo-x:${E(d.photo?.positionX||"50%")};--photo-y:${E(d.photo?.positionY||"50%")};--photo-scale:${E(String(d.photo?.scale||1))}">${media(A(d.photo?.src),{cls:"photo",attrs:I("content.photo.src")+VIDEO_OK,alt:d.photo?.alt||""})}<div class="s08-photo-overlay"><img${I("content.photo.overlayTextGraphic")} src="${A(d.photo?.overlayTextGraphic)}" alt="Since 1992"></div></div></div></div></div></div></div></section>`;
}
