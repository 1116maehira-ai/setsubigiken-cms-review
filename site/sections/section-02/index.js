import { lines, escapeHtml, safeAsset, px, num } from "../../shared/html.js";
import { visualHelpers } from "../../shared/cms-visual.js";

export const sectionKey = "section-02";

function styleVars(style = {}) {
  const d = style.desktop || {};
  const m = style.mobile || {};
  return [
    `--title-x:${px(d.titleX)}`,
    `--title-y:${px(d.titleY)}`,
    `--team-x:${px(d.teamPhotoX)}`,
    `--team-y:${px(d.teamPhotoY)}`,
    `--team-zoom:${num(d.teamPhotoZoom, 1)}`,
    `--m-title-x:${px(m.titleX)}`,
    `--m-title-y:${px(m.titleY)}`,
    `--m-team-x:${px(m.teamPhotoX)}`,
    `--m-team-y:${px(m.teamPhotoY)}`,
    `--m-team-zoom:${num(m.teamPhotoZoom, 1)}`
  ].join(";");
}

export function render(mount, data) {
  const c = data.content || {};
  const personas = Array.isArray(c.personas) ? c.personas : [];
  const { T, I } = visualHelpers(data);

  mount.innerHTML = `
    <section class="s02-fit" id="section02" style="${styleVars(data.style)}">
      <div class="inner">
        <div class="s02-head">
          <div class="s02-label"${T("content.label")}>${escapeHtml(c.label || "SECTION 02")}</div>
          <h2${T("content.title")}>${lines(c.title || "")}</h2>
        </div>

        <div class="s02-personas">
          ${personas.map((item, i) => `
            <article class="s02-persona">
              <div class="s02-persona-icon"><img${I(`content.personas.${i}.icon`)} src="${safeAsset(item.icon)}" alt=""></div>
              <p class="s02-persona-main"${T(`content.personas.${i}.text`)}>${lines(item.text || "")}</p>
              ${item.subtitle ? `<p class="s02-persona-sub"${T(`content.personas.${i}.subtitle`)}>${lines(item.subtitle)}</p>` : ""}
            </article>
          `).join("")}
        </div>

        <div class="s02-team-note">
          <div class="s02-people"><img${I("content.teamIcon")} src="${safeAsset(c.teamIcon)}" alt=""></div>
          <p${T("content.teamMessage")}>${lines(c.teamMessage || "")}</p>
          <div class="s02-team-photo" role="img" aria-label="設備技研で働く先輩社員">
            <img${I("content.teamImage")} src="${safeAsset(c.teamImage)}" alt="">
          </div>
        </div>
      </div>
    </section>
  `;
}
