import { escapeHtml, lines, safeAsset } from "../../shared/html.js";
import { visualHelpers, media, VIDEO_OK } from "../../shared/cms-visual.js";
export const sectionKey = "section-11";

export function render(mount, data){
  const c = data.content || {};
  const points = Array.isArray(c.points) ? c.points : [];
  // PC版：1段に4枚まで。5枚以上は段ごとの枚数が近くなるように分ける（5→3+2、6→3+3、7→4+3、8→4+4）。
  // 横を12等分したうちの何マス分を使うか（--span）を枠ごとに渡す（4枚の段＝3マス、3枚の段＝4マス…）。
  const perRow = [];
  { const n = points.length, rows = Math.max(1, Math.ceil(n / 4)), base = Math.floor(n / rows), extra = n % rows;
    for (let r = 0; r < rows; r++) for (let k = 0, m = base + (r < extra ? 1 : 0); k < m; k++) perRow.push(m); }
  const spanOf = (i) => 12 / (perRow[i] || 4);
  // よくある質問：PC版は1段に3つまで。4つ以上は段ごとの数が近くなるように分ける（4→2+2、5→3+2、7→3+2+2）。横6マスのうち何マス使うか。
  const faqs0 = Array.isArray(c.faqs) ? c.faqs : [];
  const faqPerRow = [];
  { const n = faqs0.length, rows = Math.max(1, Math.ceil(n / 3)), base = Math.floor(n / rows), extra = n % rows;
    for (let r = 0; r < rows; r++) for (let k = 0, m = base + (r < extra ? 1 : 0); k < m; k++) faqPerRow.push(m); }
  const faqSpanOf = (i) => 6 / (faqPerRow[i] || 3);
  const faqs = Array.isArray(c.faqs) ? c.faqs : [];
  const { T, I } = visualHelpers(data);
  mount.innerHTML = `
    <section class="s11">
      <div class="s11-diagonal s11-diagonal-a"></div>
      <div class="s11-diagonal s11-diagonal-b"></div>
      <div class="inner s11-inner">
        <div class="s11-hero">
          <div class="s11-copy">
            <div class="s11-label"${T("content.label")}>${escapeHtml(c.label || "SECTION 11")}</div>
            <div class="s11-eyebrow"${T("content.eyebrow")}>${escapeHtml(c.eyebrow || "")}</div>
            <h2${T("content.title")}>${lines(c.title || "")}</h2>
            <p class="s11-lead"${T("content.lead")}>${escapeHtml(c.lead || "")}</p>
          </div>
          <div class="s11-hero-visual">
            ${media(safeAsset(c.heroImage), { cls: "s11-hero-img", attrs: I("content.heroImage") + VIDEO_OK })}
          </div>
        </div>

        <div class="s11-points">
          ${points.map((p, i) => `
            <article class="s11-point" data-cms-item="content.points.${i}" data-cms-item-label="POINT" style="--span:${spanOf(i)}">
              <div class="s11-point-top">
                <div>
                  <div class="s11-point-num"${T(`content.points.${i}.number`)}>${escapeHtml(p.number || "")}</div>
                  <div class="s11-point-title-row">
                    <img${I(`content.points.${i}.icon`)} src="${safeAsset(p.icon)}" alt="">
                    <h3${T(`content.points.${i}.title`)}>${lines(p.title || "")}</h3>
                  </div>
                </div>
              </div>
              <div class="s11-point-photo"><img${I(`content.points.${i}.image`)} src="${safeAsset(p.image)}" alt=""></div>
              <p${T(`content.points.${i}.body`)}>${lines(p.body || "")}</p>
            </article>
          `).join("")}
        </div>

        <div class="s11-faq-head">
          <h3${T("content.faqTitle")}>${escapeHtml(c.faqTitle || "")}</h3>
          <div class="s11-faq-line"></div>
          <p${T("content.faqNote")}>${escapeHtml(c.faqNote || "")}</p>
        </div>

        <div class="s11-faqs">
          ${faqs.map((item, i) => `
            <article class="s11-faq" data-cms-item="content.faqs.${i}" data-cms-item-label="よくある質問" style="--span:${faqSpanOf(i)}">
              <div class="s11-qa">
                <div class="s11-q-badge"><span${T("content.qLabel")}>${escapeHtml(c.qLabel || "Q")}</span></div>
                <strong${T(`content.faqs.${i}.q`)}>${escapeHtml(item.q || "")}</strong>
              </div>
              <div class="s11-qa s11-answer">
                <div class="s11-a-badge"><span${T("content.aLabel")}>${escapeHtml(c.aLabel || "A")}</span></div>
                <p${T(`content.faqs.${i}.a`)}>${lines(item.a || "")}</p>
                <img${I(`content.faqs.${i}.icon`)} src="${safeAsset(item.icon)}" alt="">
              </div>
            </article>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}
