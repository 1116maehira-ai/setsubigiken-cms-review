
import { escapeHtml, lines, safeAsset } from "../../shared/html.js";
import { visualHelpers, media, VIDEO_OK } from "../../shared/cms-visual.js";
export const sectionKey = "section-10";

export function render(mount, data){
  const c = data.content || {};
  const cards = Array.isArray(c.cards) ? c.cards : [];
  const { T, I } = visualHelpers(data);
  // 1段に3枚まで。最後の段が1枚なら横長の枠（PC版）、2枚なら2枚で横幅を分け合う。
  const rest = cards.length % 3;
  const shapeOf = (i) => (i >= cards.length - rest ? (rest === 1 ? " is-wide" : " is-half") : "");
  mount.innerHTML = `
    <section class="s10">
      <div class="inner s10-inner">
        <div class="s10-top">
          <div>
            <div class="s10-label"${T("content.label")}>${escapeHtml(c.label || "SECTION 10")}</div>
            <div class="s10-banner"${T("content.banner")}>${escapeHtml(c.banner || "")}</div>
            <h2${T("content.title")}>${lines(c.title || "")}</h2>
          </div>
          <div class="s10-hero">${media(safeAsset(c.heroImage), { attrs: I("content.heroImage") + VIDEO_OK })}</div>
        </div>
        <div class="s10-cards">
          ${cards.map((card,i)=>`
            <article class="s10-card${shapeOf(i)}" data-cms-item="content.cards.${i}" data-cms-item-label="枠">
              <div class="s10-card-head"><img${I(`content.cards.${i}.icon`)} src="${safeAsset(card.icon)}" alt=""><h3${T(`content.cards.${i}.title`)}>${lines(card.title || "")}</h3></div>
              <ul>${(card.items || []).map((x,j)=>`<li data-cms-item="content.cards.${i}.items.${j}" data-cms-item-label="説明文"${T(`content.cards.${i}.items.${j}`).replace(/data-cms-empty="[^"]*"/,'data-cms-empty="＋ 説明文を入力"')}>${escapeHtml(x)}</li>`).join("")}</ul>
              <div class="s10-card-photo"><img${I(`content.cards.${i}.image`)} src="${safeAsset(card.image)}" alt=""></div>
            </article>
          `).join("")}
        </div>
        <div class="s10-footer">
          <img class="s10-footer-icon"${I("content.footerIcon")} src="${safeAsset(c.footerIcon)}" alt="">
          <div class="s10-footer-text"${T("content.footerText")}>${lines(c.footerText || "")}</div>
          <img class="s10-hand"${I("content.handwrittenGraphic")} src="${safeAsset(c.handwrittenGraphic)}" alt="一緒に、未来をつくっていきましょう。">
        </div>
      </div>
    </section>
  `;
}
