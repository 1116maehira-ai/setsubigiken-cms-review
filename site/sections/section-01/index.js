import { lines, escapeHtml, safeAsset, px, num } from "../../shared/html.js";
import { visualHelpers, media, VIDEO_OK } from "../../shared/cms-visual.js";

export const sectionKey = "section-01";

function styleVars(style = {}) {
  const d = style.desktop || {};
  const m = style.mobile || {};
  return [
    `--title-x:${px(d.titleX)}`,
    `--title-y:${px(d.titleY)}`,
    `--photo-x:${px(d.photoX)}`,
    `--photo-y:${px(d.photoY)}`,
    `--photo-zoom:${num(d.photoZoom, 1)}`,
    `--m-title-x:${px(m.titleX)}`,
    `--m-title-y:${px(m.titleY)}`,
    `--m-photo-x:${px(m.photoX)}`,
    `--m-photo-y:${px(m.photoY)}`,
    `--m-photo-zoom:${num(m.photoZoom, 1)}`
  ].join(";");
}

export function render(mount, data) {
  const c = data.content || {};
  const benefits = Array.isArray(c.benefits) ? c.benefits : [];
  const { T, I } = visualHelpers(data);

  mount.innerHTML = `
    <section class="s01-hero" id="section01" style="${styleVars(data.style)}">
      <div class="s01-photo" aria-hidden="true">
        ${media(safeAsset(c.heroImage), { attrs: I("content.heroImage") + VIDEO_OK })}
      </div>
      <div class="s01-shape" aria-hidden="true"></div>
      <div class="s01-geo" aria-hidden="true"></div>

      <div class="inner s01-inner">
        <div class="s01-label"${T("content.label")}>${escapeHtml(c.label || "SECTION 01")}</div>

        <div class="s01-copy">
          <div class="s01-tag"${T("content.eyebrow")}>${escapeHtml(c.eyebrow || "")}</div>
          <h1${T("content.title")}>${lines(c.title || "")}</h1>
          <p class="s01-body"${T("content.body")}>${lines(c.body || "")}</p>
        </div>

        <div class="s01-benefits">
          ${benefits.map((item, i) => `
            <article class="s01-benefit">
              <div class="s01-benefit-icon"><img${I(`content.benefits.${i}.icon`)} src="${safeAsset(item.icon)}" alt=""></div>
              <div>
                <strong${T(`content.benefits.${i}.title`)}>${escapeHtml(item.title || "")}</strong>
                <span${T(`content.benefits.${i}.subtitle`)}>${escapeHtml(item.subtitle || "")}</span>
              </div>
            </article>
          `).join("")}
        </div>
      </div>

      <div class="s01-bottom" aria-hidden="true"></div>
    </section>
  `;
}
