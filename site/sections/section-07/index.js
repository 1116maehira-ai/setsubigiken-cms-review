import { escapeHtml, safeAsset } from "../../shared/html.js";
import { visualHelpers } from "../../shared/cms-visual.js";
export const sectionKey = "section-07";
const E = escapeHtml;
const A = safeAsset;
// 説明文の1行：文字＋注記（注記は空なら公開ページには出さない。ビジュアル編集の画面では空の入力枠を作り、マウスを乗せた行にだけ表示する）
// 注記は、行の配列のとなりの「〇〇Notes」（例：lines → linesNotes、welcome → welcomeNotes）に同じ番号で保存する。
const label=(attr,word)=>attr.replace(/data-cms-empty="[^"]*"/,`data-cms-empty="＋ ${word}を入力"`);
function getPath(o,p){return String(p).split(".").reduce((a,k)=>a?.[k],o)}
function alignOf(data,stylePath){const a=getPath(data,stylePath)?.textAlign;return /^(left|center|right|justify)$/.test(String(a||""))?` style="text-align:${a}"`:""}
function lineHtml(data,T,ed,tag,base,lines=[],notes=[],itemLabel){
  return (lines||[]).map((line,j)=>{
    const note=(notes||[])[j]||"";
    const notePath=`${base}Notes.${j}`;
    const sp=base.split(".");const styleKey=`${sp.slice(0,-1).join(".")}.${sp[sp.length-1]}Styles.${j}`;
    return `<${tag} class="s07-line" data-cms-item="${base}.${j}" data-cms-item-label="${itemLabel}"${alignOf(data,styleKey)}><span class="s07-line-text"${label(T(`${base}.${j}`),"説明文")}>${E(line)}</span>${(note||ed)?`<span class="s07-inline-note"${label(T(notePath),"注記")}>${E(note)}</span>`:""}</${tag}>`;
  }).join("");
}
export function render(mount,data){
  const d=data.content||{};
  const {T,I}=visualHelpers(data);
  const ed=!!data.__editor; // ビジュアル編集の画面だけ、空欄の注記の入れ物も作る
  const left=(d.leftCards||[]).map((card,i)=>`<article class="s07-card s07-mini" data-cms-item="content.leftCards.${i}" data-cms-item-label="枠（左の列）"><div class="icon"><img${I(`content.leftCards.${i}.icon`)} src="${A(card.icon)}" alt=""></div><div><h3${T(`content.leftCards.${i}.heading`)}>${E(card.heading||"")}</h3><div class="content">${lineHtml(data,T,ed,"p",`content.leftCards.${i}.lines`,card.lines,card.linesNotes,"説明文")}</div></div></article>`).join("");
  const req=((d.conditions||{}).required||[]).map((item,k)=>`<li class="s07-line" data-cms-item="content.conditions.required.${k}" data-cms-item-label="必須条件"${alignOf(data,`content.conditions.required.${k}.textStyle`)}><span class="s07-line-text"${label(T(`content.conditions.required.${k}.text`),"説明文")}>${E(item.text||"")}</span>${(item.note||ed)?`<span class="s07-inline-note"${T(`content.conditions.required.${k}.note`)}>${E(item.note)}</span>`:""}</li>`).join("");
  const wel=lineHtml(data,T,ed,"li","content.conditions.welcome",(d.conditions||{}).welcome,(d.conditions||{}).welcomeNotes,"歓迎条件");
  const right=(d.rightCards||[]).map((card,i)=>`<article class="s07-card s07-side" data-cms-item="content.rightCards.${i}" data-cms-item-label="枠（右の列）"><div class="s07-side-head"><div class="icon"><img${I(`content.rightCards.${i}.icon`)} src="${A(card.icon)}" alt=""></div><h3${T(`content.rightCards.${i}.heading`)}>${E(card.heading||"")}</h3></div><div class="content">${lineHtml(data,T,ed,"p",`content.rightCards.${i}.lines`,card.lines,card.linesNotes,"説明文")}</div>${(card.note||ed)?`<div class="note"${T(`content.rightCards.${i}.note`)}>${E(card.note)}</div>`:""}</article>`).join("");
  mount.innerHTML=`<section class="s07"><div class="s07-bg-tri"></div><div class="inner"><div class="s07-label"${T("content.meta.label")}>${E(d.meta?.label||"SECTION 07")}</div><h2 class="s07-title"${T("content.meta.title")}>${E(d.meta?.title||"")}</h2><div class="s07-title-bar"></div><div class="s07-grid"><div class="s07-stack left">${left}</div><article class="s07-card s07-conditions"><div class="s07-conditions-head"><img${I("content.conditions.icon")} src="${A(d.conditions?.icon)}" alt=""><h3${T("content.conditions.heading")}>${E(d.conditions?.heading||"")}</h3></div><div class="s07-conditions-block-title"${T("content.conditions.requiredTitle")}>${E(d.conditions?.requiredTitle||"")}</div><ul class="s07-conditions-list">${req}</ul><div class="s07-conditions-block-title"${T("content.conditions.welcomeTitle")}>${E(d.conditions?.welcomeTitle||"")}</div><ul class="s07-conditions-list">${wel}</ul></article><div class="s07-stack right">${right}</div></div></div></section>`;
}
