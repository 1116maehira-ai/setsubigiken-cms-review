import {applyImagePositions,applyImageRotations} from "./media-tuning.js";
import {restoreV2,applyV2} from "./v2-display.js";
import { CARD_GROUPS, MAIN_IMAGE_SELECTORS } from "./cms-tuning-config.js";

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function lines(value = "") {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

export { safeAsset } from "./safety.js";

export function px(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n}px` : `${fallback}px`;
}

export function num(value, fallback = 1) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function applyOneCard(el, cfg = {}, sectionKey = "", baseScale) {
  if (!el || !Object.keys(cfg).length) return;

  // Entry form container stays fixed so its input fields are not moved or scaled.
  const isEntryForm = sectionKey === "section-12" && el.matches(".s12-form-card");
  if (!isEntryForm) {
    el.style.translate = `${Number(cfg.x ?? 0)}px ${Number(cfg.y ?? 0)}px`;
    el.style.scale = String(Number(cfg.scale ?? 1));
    el.style.transformOrigin = "center center";
  } else {
    el.style.translate = "0px 0px";
    el.style.scale = "1";
  }

  // Select the actual card heading rather than the first strong/time/number.
  const headingSelectors = {
    "section-02": { ".s02-persona": ".s02-persona-main" },
    "section-03": { ".s03-card": ".s03-copy h3" },
    "section-05": {
      ".s05-column": ".s05-column-head",
      ".s05-item": ".s05-item-body h3"
    },
    "section-07": { ".s07-card": "h3" },
    "section-09": { ".s09-card": ".s09-copy h3" },
    "section-10": { ".s10-card": ".s10-card-head h3" },
    "section-11": { ".s11-point": ".s11-point-title-row h3", ".s11-faq": ".s11-qa strong" },
    "section-08": { ".s08-row": ".s08-year" },
    "section-12": { ".s12-contact": "strong", ".s12-form-card": ".s12-form-head h3" }
  };
  const groupSelectors = headingSelectors[sectionKey] || {};
  const groupEntry = Object.entries(groupSelectors).find(([cardSelector]) => el.matches(cardSelector));
  const heading = el.querySelector(groupEntry ? groupEntry[1] : "h1,h2,h3,h4,strong,.s05-time,.s08-year");
  if (heading) {
    heading.style.translate = `calc(${Number(cfg.titleX ?? 0)}px + var(--cms-tx, 0px)) calc(${Number(cfg.titleY ?? 0)}px + var(--cms-ty, 0px))`;
    heading.style.scale = `calc(${Number(cfg.titleScale ?? 1)} * var(--cms-sc, 1))`;
    heading.style.transformOrigin = "left center";
  }

  // SECTION 05: the time label has its own position and size controls.
  if (sectionKey === "section-05" && el.matches(".s05-item")) {
    const time = el.querySelector(".s05-time");
    if (time) {
      time.style.translate = `calc(${Number(cfg.timeX ?? 0)}px + var(--cms-tx, 0px)) calc(${Number(cfg.timeY ?? 0)}px + var(--cms-ty, 0px))`;
      time.style.scale = `calc(${Number(cfg.timeScale ?? 1)} * var(--cms-sc, 1))`;
      time.style.transformOrigin = "left center";
    }
  }

  // Explicit per-section selectors avoid moving card numbers, times, or icons.
  const bodySelectors = {
    "section-01": { ".s01-benefit": ".s01-benefit > div > span" },
    "section-02": { ".s02-persona": ".s02-persona-sub" },
    "section-03": { ".s03-card": ".s03-copy p" },
    "section-04": { ".s04-card--job": ".s04-copy > p", ".s04-card--wide": ".s04-copy > p" },
    "section-05": { ".s05-item": ".s05-item-body p" },
    "section-07": { ".s07-card.s07-mini": ".content", ".s07-card.s07-side": ".content", ".s07-conditions": ".s07-conditions-list" },
    "section-09": { ".s09-card": ".s09-copy p" },
    "section-10": { ".s10-card": "ul" },
    "section-11": { ".s11-point": ":scope > p", ".s11-faq": ".s11-answer p" },
    "section-08": { ".s08-row": ".s08-text" },
    "section-12": { ".s12-contact": "small", ".s12-form-card": ".s12-form-head p" }
  };
  const bodyEntry = Object.entries(bodySelectors[sectionKey] || {}).find(([selector]) => el.matches(selector));
  const body = bodyEntry ? el.querySelector(bodyEntry[1]) : null;
  if (body) {
    body.style.translate = `calc(${Number(cfg.subtitleX ?? 0)}px + var(--cms-tx, 0px)) calc(${Number(cfg.subtitleY ?? 0)}px + var(--cms-ty, 0px))`;
    body.style.scale = `calc(${Number(cfg.subtitleScale ?? 1)} * var(--cms-sc, 1))`;
    body.style.transformOrigin = "left center";
  }

  if (sectionKey === "section-07" && el.matches(".s07-conditions")) {
    el.querySelectorAll(".s07-conditions-list").forEach((list) => {
      list.style.translate = `calc(${Number(cfg.subtitleX ?? 0)}px + var(--cms-tx, 0px)) calc(${Number(cfg.subtitleY ?? 0)}px + var(--cms-ty, 0px))`;
      list.style.scale = `calc(${Number(cfg.subtitleScale ?? 1)} * var(--cms-sc, 1))`;
      list.style.transformOrigin = "left center";
    });
  }

  if (sectionKey === "section-07" && el.matches(".s07-conditions")) {
    const targets = {
      requiredTitle: el.querySelectorAll(".s07-conditions-block-title")[0],
      welcomeTitle: el.querySelectorAll(".s07-conditions-block-title")[1],
      required: el.querySelector(".s07-required-list"),
      welcome: el.querySelector(".s07-welcome-list")
    };
    for (const [field,target] of Object.entries(targets)) {
      if (!target) continue;
      target.style.translate = `calc(${Number(cfg[`${field}X`] ?? 0)}px + var(--cms-tx, 0px)) calc(${Number(cfg[`${field}Y`] ?? 0)}px + var(--cms-ty, 0px))`;
      target.style.scale = `calc(${Number(cfg[`${field}Scale`] ?? 1)} * var(--cms-sc, 1))`;
      target.style.transformOrigin = "left center";
    }
  }

  if (sectionKey === "section-07" && el.matches(".s07-card.s07-side")) {
    const note = el.querySelector(".note");
    if (note) {
      note.style.translate = `calc(${Number(cfg.noteX ?? 0)}px + var(--cms-tx, 0px)) calc(${Number(cfg.noteY ?? 0)}px + var(--cms-ty, 0px))`;
      note.style.scale = `calc(${Number(cfg.noteScale ?? 1)} * var(--cms-sc, 1))`;
      note.style.transformOrigin = "left center";
    }
  }

  if (sectionKey === "section-12" && el.matches(".s12-form-card")) {
    for (const [field, selector] of [["badge", ".s12-form-badge"], ["button", ".s12-submit"]]) {
      const target = el.querySelector(selector);
      if (!target) continue;
      target.style.translate = `calc(${Number(cfg[`${field}X`] ?? 0)}px + var(--cms-tx, 0px)) calc(${Number(cfg[`${field}Y`] ?? 0)}px + var(--cms-ty, 0px))`;
      target.style.scale = `calc(${Number(cfg[`${field}Scale`] ?? 1)} * var(--cms-sc, 1))`;
      target.style.transformOrigin = "center center";
    }
  }

  if (sectionKey === "section-11" && el.matches(".s11-faq")) {
    for (const [field, selector] of [["qBadge", ".s11-q-badge"], ["aBadge", ".s11-a-badge"]]) {
      const badge = el.querySelector(selector);
      if (!badge) continue;
      badge.style.translate = `calc(${Number(cfg[`${field}X`] ?? 0)}px + var(--cms-tx, 0px)) calc(${Number(cfg[`${field}Y`] ?? 0)}px + var(--cms-ty, 0px))`;
      badge.style.scale = `calc(${Number(cfg[`${field}Scale`] ?? 1)} * var(--cms-sc, 1))`;
      badge.style.transformOrigin = "center center";
    }
  }

  const extraElementSelectors = {
    "section-03": {".s03-card": [["number", ".s03-meta strong"],["icon", ".s03-meta img"]]},
    "section-04": {".s04-card": [["icon", ".s04-card-title img"]]},
    "section-09": {".s09-card": [["role", ".s09-role"]]},
    "section-10": {".s10-card": [["photo", ".s10-card-photo img"]]},
    "section-11": {".s11-point": [["photo", ".s11-point-photo img"]]}
  };
  const extraEntry = Object.entries(extraElementSelectors[sectionKey] || {})
    .find(([selector]) => el.matches(selector));
  if (extraEntry) {
    for (const [field, selector] of extraEntry[1]) {
      const target = el.querySelector(selector);
      if (!target) continue;
      target.style.translate = `calc(${Number(cfg[`${field}X`] ?? 0)}px + var(--cms-tx, 0px)) calc(${Number(cfg[`${field}Y`] ?? 0)}px + var(--cms-ty, 0px))`;
      target.style.scale = `calc(${Number(cfg[`${field}Scale`] ?? 1)} * var(--cms-sc, 1))`;
      target.style.transformOrigin = "center center";
    }
  }

  // An image slider must target the intended icon/photo, not an arbitrary first image.
  const imageSelectors = {
    "section-07": { ".s07-card": ".icon img", ".s07-conditions": ".s07-conditions-head img" },
    "section-09": { ".s09-card": ".s09-visual img" },
    "section-10": { ".s10-card": ".s10-card-head img" },
    "section-11": { ".s11-point": ".s11-point-title-row img", ".s11-faq": ".s11-answer img" },
    "section-12": { ".s12-contact": ":scope > img", ".s12-form-card": ".s12-form-head img" }
  };
  const imageEntry = Object.entries(imageSelectors[sectionKey] || {}).find(([selector]) => el.matches(selector));
  const image = imageEntry ? el.querySelector(imageEntry[1]) : el.querySelector("img");
  if (image) {
    image.style.translate = `${Number(cfg.imageX ?? 0)}px ${Number(cfg.imageY ?? 0)}px`;
    image.style.scale = String(Number(cfg.imageZoom ?? 1));
    image.style.transformOrigin = "center center";
    baseScale?.set(image, Number(image.style.scale) || 1);
  }
}

export function applyCmsTuning(mount, style = {}, sectionKey = "", data = {}) {
  if (!mount) return;

  const apply = () => {
    restoreV2(mount);
    const baseScale = new Map();
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    const mode = (mobile ? style.mobile : style.desktop) || {};

    const sectionHeadingSelectors = {
      "section-09": ".s09-banner",
      "section-10": ".s10-top h2"
    };
    const heading = mount.querySelector(sectionHeadingSelectors[sectionKey] || "h1,h2");
    if (heading) {
      heading.style.translate = `calc(${Number(mode.titleX ?? 0)}px + var(--cms-tx, 0px)) calc(${Number(mode.titleY ?? 0)}px + var(--cms-ty, 0px))`;
      heading.style.scale = `calc(${Number(mode.titleScale ?? 1)} * var(--cms-sc, 1))`;
      heading.style.transformOrigin = "left top";
    }

    // Each section uses its own number label markup. Keep the existing
    // section 01-07 targets, and include section 08-12 in the same controls.
    const sectionNumberSelectors = {
      "section-01": ".s01-label",
      "section-02": ".s02-label",
      "section-03": '[data-cms-path="content.label"]',
      "section-04": '[data-cms-path="content.label"]',
      "section-05": '[data-cms-path="content.label"]',
      "section-06": '[data-cms-path="content.label"]',
      "section-07": ".s07-label",
      "section-08": ".s08-label",
      "section-09": ".s09-label",
      "section-10": ".s10-label",
      "section-11": ".s11-label",
      "section-12": ".s12-label"
    };
    const sectionNumberSelector = sectionNumberSelectors[sectionKey];
    const sectionNumber = sectionNumberSelector ? mount.querySelector(sectionNumberSelector) : null;
    if (sectionNumber) {
      if (["section-03", "section-04", "section-05", "section-06", "section-07"].includes(sectionKey)) sectionNumber.style.display = "inline-block";
      sectionNumber.style.translate = `calc(${Number(mode.sectionNumberX ?? 0)}px + var(--cms-tx, 0px)) calc(${Number(mode.sectionNumberY ?? 0)}px + var(--cms-ty, 0px))`;
      sectionNumber.style.scale = `calc(${Number(mode.sectionNumberScale ?? 1)} * var(--cms-sc, 1))`;
      sectionNumber.style.transformOrigin = "left center";
    }

    if (["section-01", "section-03", "section-04", "section-05"].includes(sectionKey)) {
      const eyebrow = mount.querySelector(sectionKey === "section-01" ? ".s01-tag" : '[data-cms-path="content.labelText"]');
      if (eyebrow) {
        if (["section-03", "section-04", "section-05"].includes(sectionKey)) eyebrow.style.display = "inline-block";
        eyebrow.style.translate = `calc(${Number(mode.eyebrowX ?? 0)}px + var(--cms-tx, 0px)) calc(${Number(mode.eyebrowY ?? 0)}px + var(--cms-ty, 0px))`;
        eyebrow.style.scale = `calc(${Number(mode.eyebrowScale ?? 1)} * var(--cms-sc, 1))`;
        eyebrow.style.transformOrigin = "left center";
      }
    }

    if (sectionKey === "section-06") {
      const note = mount.querySelector(".s06-note");
      if (note) {
        note.style.translate = `calc(${Number(mode.noteX ?? 0)}px + var(--cms-tx, 0px)) calc(${Number(mode.noteY ?? 0)}px + var(--cms-ty, 0px))`;
        note.style.scale = `calc(${Number(mode.noteScale ?? 1)} * var(--cms-sc, 1))`;
        note.style.transform = `rotate(${Number(mode.noteRotate ?? -7)}deg)`;
        note.style.transformOrigin = "left center";
      }
    }

    const standaloneSelectors = {
      "section-08": {headline:".s08-headline",overlayGraphic:".s08-photo-overlay img"},
      "section-11": {eyebrow:".s11-eyebrow",lead:".s11-lead",faqTitle:".s11-faq-head h3",faqNote:".s11-faq-head p"},
      "section-12": {eyebrow:".s12-eyebrow",body:".s12-body",handwritten:".s12-hand"}
    };
    for (const [field,selector] of Object.entries(standaloneSelectors[sectionKey] || {})) {
      const target = mount.querySelector(selector);
      if (!target) continue;
      target.style.translate = `calc(${Number(mode[`${field}X`] ?? 0)}px + var(--cms-tx, 0px)) calc(${Number(mode[`${field}Y`] ?? 0)}px + var(--cms-ty, 0px))`;
      target.style.scale = `calc(${Number(mode[`${field}Scale`] ?? 1)} * var(--cms-sc, 1))`;
      target.style.transformOrigin = "left center";
    }

    if (sectionKey === "section-10") {
      const banner = mount.querySelector(".s10-banner");
      if (banner) {
        banner.style.translate = `calc(${Number(mode.bannerX ?? 0)}px + var(--cms-tx, 0px)) calc(${Number(mode.bannerY ?? 0)}px + var(--cms-ty, 0px))`;
        banner.style.scale = `calc(${Number(mode.bannerScale ?? 1)} * var(--cms-sc, 1))`;
        banner.style.transformOrigin = "left center";
      }
    }
    const footerSelectors = {
      "section-09": {hand:".s09-hand img"},
      "section-10": {footerText:".s10-footer-text",footerIcon:".s10-footer-icon",footerHand:".s10-hand"},
      "section-12": {footerLogo:".s12-brand-logo",footerTagline:".s12-brand small",footerHand:".s12-footer-hand",footerImage:".s12-footer-scene img",footerEnglish:".s12-footer-scene div",footerCopyright:".s12-footer-bottom > small",footerNav:".s12-footer-bottom nav"}
    };
    for (const [field,selector] of Object.entries(footerSelectors[sectionKey] || {})) {
      const target = mount.querySelector(selector);
      if (!target || ![`${field}X`,`${field}Y`,`${field}Scale`].some(k=>k in mode)) continue;
      const x = Number(mode[`${field}X`] ?? 0);
      const y = Number(mode[`${field}Y`] ?? 0);
      const scale = Number(mode[`${field}Scale`] ?? 1);
      // Use the conventional transform property for footer elements, especially
      // the SECTION 12 logo image, to ensure the tuning is visible in preview.
      target.style.translate = "";
      target.style.scale = "";
      target.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      target.style.transformOrigin = "center center";
    }

    const imageSelector = MAIN_IMAGE_SELECTORS[sectionKey];
    const image = imageSelector ? mount.querySelector(imageSelector) : null;
    if (image) {
      const x = mode.imageX ?? mode.photoX ?? mode.teamPhotoX ?? 0;
      const y = mode.imageY ?? mode.photoY ?? mode.teamPhotoY ?? 0;
      const z = mode.imageZoom ?? mode.photoZoom ?? mode.teamPhotoZoom ?? 1;
      image.style.translate = `${Number(x)}px ${Number(y)}px`;
      image.style.scale = String(Number(z));
      image.style.transformOrigin = "center center";
    baseScale?.set(image, Number(image.style.scale) || 1);
    }

    const groups = CARD_GROUPS[sectionKey] || [];
    for (const group of groups) {
      const els = [...mount.querySelectorAll(group.selector)];
      els.forEach((el, domIndex) => {
        const attrIndex = group.indexAttr ? Number(el.getAttribute(group.indexAttr)) : NaN;
        const index = Number.isFinite(attrIndex) ? attrIndex : domIndex;
        const cfg = mode.cards?.[group.key]?.[index] || {};
        applyOneCard(el, cfg, sectionKey, baseScale);
      });
    }
    applyImagePositions(mount, mode.imagePositions, baseScale);
    applyImageRotations(mount, mode.imageRotations);
    applyV2(mount, data, mobile ? "mobile" : "desktop");
  };

  apply();

  if (mount.__cmsTuningObserver) mount.__cmsTuningObserver.disconnect();
  const observer = new MutationObserver(() => apply());
  observer.observe(mount, { childList:true, subtree:true });
  mount.__cmsTuningObserver = observer;

  const mq = window.matchMedia("(max-width: 760px)");
  // A new render must replace the old closure, otherwise switching sections/devices
  // may re-apply a previous section's saved tuning values.
  if (mount.__cmsTuningMediaHandler) mq.removeEventListener?.("change", mount.__cmsTuningMediaHandler);
  mount.__cmsTuningMediaHandler = apply;
  mq.addEventListener?.("change", apply);
}
