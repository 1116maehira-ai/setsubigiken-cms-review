
import { escapeHtml, lines, safeAsset } from "../../shared/html.js";
import { visualHelpers } from "../../shared/cms-visual.js";
export const sectionKey = "section-09";

export function render(mount, data){
  const c = data.content || {};
  const messages = Array.isArray(c.messages) ? c.messages : [];
  const { T, I } = visualHelpers(data);
  const s = data.style || {};
  const d = s.desktop || {}, m = s.mobile || {};
  mount.innerHTML = `
    <section class="s09" style="
      --bg-x:${Number(d.bgX ?? 50)}%;
      --bg-y:${Number(d.bgY ?? 50)}%;
      --bg-z:${Number(d.bgZoom ?? 1)};
      --m-bg-x:${Number(m.bgX ?? 50)}%;
      --m-bg-y:${Number(m.bgY ?? 48)}%;
      --m-bg-z:${Number(m.bgZoom ?? 1.08)};
    ">
      <div class="s09-bg"${I("content.backgroundImage")}><img src="${safeAsset(c.backgroundImage)}" alt=""></div>
      <div class="s09-overlay"${I("content.backgroundImage")}></div>
      <div class="s09-orb s09-orb-a"></div>
      <div class="s09-orb s09-orb-b"></div>
      <div class="s09-dots s09-dots-a"></div>
      <div class="s09-dots s09-dots-b"></div>

      <div class="inner s09-inner">
        <div class="s09-head">
          <div class="s09-label"${T("content.label")}>${escapeHtml(c.label || "SECTION 09")}</div>
          <div class="s09-banner"${T("content.banner")}>${escapeHtml(c.banner || "")}</div>
        </div>

        <div class="s09-grid">
          ${messages.map((msg, i) => `
            <article class="s09-card ${i === 0 ? "is-blue" : "is-white"}" data-cms-item="content.messages.${i}" data-cms-item-label="メッセージ">
              <div class="s09-card-inner">
                <div class="s09-copy">
                  <div class="s09-role"><span${T(`content.messages.${i}.role`)}>${escapeHtml(msg.role || "")}</span>　<span${T(`content.messages.${i}.name`)}>${escapeHtml(msg.name || "")}</span><span${T("content.roleSuffix")}>${escapeHtml(c.roleSuffix || "より")}</span></div>
                  <h3${T(`content.messages.${i}.headline`)}>${lines(msg.headline || "")}</h3>
                  <p${T(`content.messages.${i}.body`)}>${lines(msg.body || "")}</p>
                </div>
                <div class="s09-visual">
                  <div class="s09-photo-frame"></div>
                  <img${I(`content.messages.${i}.image`)} src="${safeAsset(msg.image)}" alt="">
                </div>
              </div>
            </article>
          `).join("")}
        </div>

        <div class="s09-hand"><img${I("content.handwrittenGraphic")} src="${safeAsset(c.handwrittenGraphic)}" alt="一緒に、未来をつくっていきましょう。"></div>
      </div>
    </section>
  `;
}
