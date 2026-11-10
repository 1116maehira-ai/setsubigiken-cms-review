import { escapeHtml, lines, safeAsset } from "../../shared/html.js";
import { visualHelpers } from "../../shared/cms-visual.js";
export const sectionKey = "section-12";

// 連絡先の補足（営業時間・定休日など）：1行ずつ並べて表示する（電話のカードは「営業時間｜定休日」を横に並べる）
function subLines(text) {
  const rows = String(text || "").split(/\r?\n/).filter((t) => t.trim() !== "");
  return rows.map((t) => `<span>${escapeHtml(t)}</span>`).join("");
}

export function render(mount, data){
  const c = data.content || {};
  const f = c.form || {};
  const footer = c.footer || {};
  const contacts = Array.isArray(c.contacts) ? c.contacts : [];
  const fields = Array.isArray(f.fields) ? f.fields : [];
  const jobs = Array.isArray(f.jobs) ? f.jobs : [];
  const { T, I } = visualHelpers(data);
  const ed = !!data.__editor; // ビジュアル編集の画面だけ、空欄の画像の入れ物も作る

  mount.innerHTML = `
    <section class="s12">
      <div class="inner s12-main">
        <div class="s12-left">
          <div class="s12-label"${T("content.label")}>${escapeHtml(c.label || "SECTION 12")}</div>
          <div class="s12-eyebrow"${T("content.eyebrow")}>${escapeHtml(c.eyebrow || "")}</div>
          <h2${T("content.title")}>${lines(c.title || "")}</h2>
          <p class="s12-body"${T("content.body")}>${lines(c.body || "")}</p>
          <img class="s12-person"${I("content.personImage")} src="${safeAsset(c.personImage)}" alt="">
          ${(c.handwritten || ed) ? `<img class="s12-hand"${I("content.handwritten")} src="${safeAsset(c.handwritten)}" alt="">` : ''}
          <div class="s12-contacts">
            ${contacts.map((item,i)=>`
              <div class="s12-contact${String(item.main || "").trim().startsWith("〒") ? " s12-contact--address" : ""}">
                <img${I(`content.contacts.${i}.icon`)} src="${safeAsset(item.icon)}" alt="">
                <div><strong${T(`content.contacts.${i}.main`)}>${escapeHtml(item.main || "")}</strong><small class="s12-contact-sub"${T(`content.contacts.${i}.sub`)}>${subLines(item.sub)}</small></div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="s12-form-card">
          <div class="s12-form-head">
            <img${I("content.form.icon")} src="${safeAsset(f.icon)}" alt="">
            <div><h3${T("content.form.title")}>${escapeHtml(f.title || "")}</h3><p${T("content.form.lead")}>${lines(f.lead || "")}</p></div>
            <div class="s12-form-badge"${T("content.form.badge")}>${lines(f.badge || "")}</div>
          </div>

          <form class="s12-form">
            ${fields.map((field,i)=>`
              <label class="s12-field">
                <span><span${T(`content.form.fields.${i}.label`)}>${escapeHtml(field.label || "")}</span>${field.required ? `<b${T("content.form.requiredLabel")}>${escapeHtml(f.requiredLabel || "必須")}</b>` : ''}</span>
                <input type="${escapeHtml(field.type || "text")}" name="${escapeHtml(field.name || "")}" placeholder="${escapeHtml(field.placeholder || "")}" ${field.required ? "required":""} data-cms-placeholder="content.form.fields.${i}.placeholder">
              </label>
            `).join("")}

            <label class="s12-field">
              <span><span${T("content.form.jobLabel")}>${escapeHtml(f.jobLabel || "希望職種")}</span><b${T("content.form.requiredLabel")}>${escapeHtml(f.requiredLabel || "必須")}</b></span>
              <select required data-cms-options="content.form.jobs">${jobs.map((j,i)=>`<option value="${i===0 ? "" : escapeHtml(j)}">${escapeHtml(j)}</option>`).join("")}</select>
            </label>

            <label class="s12-field s12-message">
              <span${T("content.form.messageLabel")}>${lines(f.messageLabel || "")}</span>
              <textarea placeholder="${escapeHtml(f.messagePlaceholder || "")}" data-cms-placeholder="content.form.messagePlaceholder"></textarea>
            </label>

            <button type="button" disabled aria-disabled="true" class="s12-submit">
              <img${I("content.form.buttonIcon")} src="${safeAsset(f.buttonIcon || "./assets/send-paper-plane.png")}" alt="">
              <span${T("content.form.button")}>${escapeHtml(f.button || "")}</span><em>→</em>
            </button>
          </form>
        </div>
      </div>

      <footer class="s12-footer">
        <div class="s12-footer-top">
          <div class="s12-brand">
            ${(footer.logo || ed) ? `<img class="s12-brand-logo"${I("content.footer.logo")} src="${safeAsset(footer.logo)}" alt="${escapeHtml(footer.company || '')}">` : ''}
          </div>
          <div class="s12-footer-hand">
            ${(footer.tagline || ed) ? `<small class="s12-tagline"${T("content.footer.tagline")}>${escapeHtml(footer.tagline || "")}</small>` : ''}
            ${(footer.handwrittenImage || ed) ? `<img${I("content.footer.handwrittenImage")} src="${safeAsset(footer.handwrittenImage)}" alt="${escapeHtml(footer.handwritten || '')}">` : ''}${footer.handwrittenImage ? '' : `<span${T("content.footer.handwritten")}>${lines(footer.handwritten || "")}</span>`}
          </div>
          <div class="s12-footer-scene">
            <img${I("content.footer.image")} src="${safeAsset(footer.image)}" alt="">
            <div${T("content.footer.english")}>${lines(footer.english || "")}</div>
          </div>
        </div>
        <div class="s12-footer-bottom">
          <small${T("content.footer.copyright")}>${escapeHtml(footer.copyright || "")}</small>
          <nav>${(footer.nav || []).map((x,j)=>`<a href="#"${T(`content.footer.nav.${j}`)}>${escapeHtml(x)}</a>`).join("")}</nav>
        </div>
      </footer>
    </section>
  `;
}
