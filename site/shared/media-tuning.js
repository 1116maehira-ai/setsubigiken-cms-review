const num=(v,f=1)=>Number.isFinite(Number(v))?Number(v):f;
export function hasOwnTransform(img) {
  const t = getComputedStyle(img).transform;
  return !(t === "none" || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(t));
}

// 画像・動画の傾き（style.<端末>.imageRotations["content.xxx"] = 度）。元のデザインの傾きに足される。
function applyImageRotations(mount, rotations) {
  const touched = new Set();
  for (const [path, deg] of Object.entries(rotations && typeof rotations === "object" ? rotations : {})) {
    const n = Number(deg);
    if (!Number.isFinite(n) || !n) continue;
    const safe = window.CSS?.escape ? CSS.escape(path) : String(path).replace(/"/g, "");
    mount.querySelectorAll(`[data-cms-image-path="${safe}"]`).forEach((marker) => {
      const img = targetImg(marker);
      if (!img || touched.has(img)) return;
      touched.add(img);
      img.style.rotate = `${n}deg`;
      img.dataset.cmsRot = "1";
    });
  }
  mount.querySelectorAll("img[data-cms-rot], video[data-cms-rot]").forEach((img) => {
    if (touched.has(img)) return;
    img.style.rotate = "";
    delete img.dataset.cmsRot;
  });
}

function targetImg(marker) {
  if (!marker) return null;
  return (marker.tagName === "IMG" || marker.tagName === "VIDEO") ? marker : marker.querySelector("img, video");
}

function applyImagePositions(mount, positions, baseScale) {
  const touched = new Set();
  const list = positions && typeof positions === "object" ? positions : {};
  for (const [path, cfg] of Object.entries(list)) {
    if (!cfg || typeof cfg !== "object") continue;
    const safe = window.CSS?.escape ? CSS.escape(path) : String(path).replace(/"/g, "");
    mount.querySelectorAll(`[data-cms-image-path="${safe}"]`).forEach((marker) => {
      const img = targetImg(marker);
      if (!img || touched.has(img)) return;
      touched.add(img);
      // 画像が枠いっぱいに引き伸ばされる設定（fill）のままだと焦点位置が効かないため、
      // 位置を指定したときだけ cover（枠に合わせて切り抜き）にする。縦横比が枠と同じなら見た目は変わらない。
      if (getComputedStyle(img).objectFit === "fill") {
        img.style.objectFit = "cover";
        img.dataset.cmsPosFit = "1";
      }
      img.style.objectPosition = `${num(cfg.x, 50)}% ${num(cfg.y, 50)}%`;
      img.style.scale = String((baseScale.get(img) ?? 1) * num(cfg.zoom, 1));
      // 拡大の中心を焦点位置に合わせる。拡大している間は、焦点位置で上下左右どちらにも寄せられる
      // （拡大率1以上なので、元の枠の中にすき間はできない）。
      img.style.transformOrigin = hasOwnTransform(img) ? "center center" : `${num(cfg.x, 50)}% ${num(cfg.y, 50)}%`;
      img.dataset.cmsPos = "1";
    });
  }
  // 位置を「リセット」した画像は、元のデザイン（CSS）の状態に戻す。
  mount.querySelectorAll("img[data-cms-pos], video[data-cms-pos]").forEach((img) => {
    if (touched.has(img)) return;
    img.style.objectPosition = "";
    img.style.scale = baseScale.has(img) ? String(baseScale.get(img)) : "";
    img.style.transformOrigin = baseScale.has(img) ? "center center" : "";
    if (img.dataset.cmsPosFit) { img.style.objectFit = ""; delete img.dataset.cmsPosFit; }
    delete img.dataset.cmsPos;
  });
}


export {applyImagePositions,applyImageRotations};
