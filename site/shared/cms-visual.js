// Display-only equivalents of Gibo's original formatting markers. No editing controls.
import { escapeAttribute, finite, validColor, normalizeMedia, isVideoMedia } from './safety.js';

const getPath = (obj, path) => String(path).split('.').reduce((v, k) => v?.[k], obj);
const marker = path => /^content(?:\.(?:[A-Za-z_]\w*|\d+))+$/.test(path) ? path : '';

export function styleBasePathFor(path) {
  const keys = String(path).split('.'), last = keys.at(-1);
  if (/^\d+$/.test(last) && keys.length >= 2) return [...keys.slice(0, -2), keys.at(-2) + 'Styles', last].join('.');
  return [...keys.slice(0, -1), last + 'Style'].join('.');
}

function transformValues(s = {}) {
  const tx = finite(s.x), ty = finite(s.y), sc = finite(s.scale, 1, .05, 20), rot = finite(s.rotate, 0, -360, 360);
  return { tx, ty, sc, rot, any: !!(tx || ty || sc !== 1 || rot) };
}

export function textStyleAttr(s = {}) {
  if (!s || typeof s !== 'object') return '';
  const parts = [];
  const font = String(s.fontFamily || '').replace(/["']/g, '').trim();
  if (font && font.length <= 150 && /^[\p{L}\p{N} _,-]+$/u.test(font)) parts.push('font-family:' + font);
  const size = String(s.fontSize || '');
  if (/^\d+(?:\.\d+)?(?:px|rem|em|%)$/.test(size) && parseFloat(size) <= 500) parts.push('font-size:' + size);
  if (/^(?:[1-9]00|normal|bold|bolder|lighter)$/.test(String(s.fontWeight))) parts.push('font-weight:' + s.fontWeight);
  if (/^(?:none|underline|line-through|overline)$/.test(String(s.textDecoration))) parts.push('text-decoration:' + s.textDecoration);
  const color = validColor(s.color); if (color) parts.push('color:' + color);
  if (/^(?:left|center|right|justify|start|end)$/.test(String(s.textAlign))) parts.push('text-align:' + s.textAlign);
  const base = transformValues(s), mobile = s.mobile && typeof s.mobile === 'object' ? transformValues(s.mobile) : null;
  let xf = false, xfm = false;
  if (base.any) { parts.push(`--cms-tx:${base.tx}px`, `--cms-ty:${base.ty}px`, `--cms-sc:${base.sc}`, `--cms-rot:${base.rot}deg`, 'display:inline-block'); xf = true; }
  if (mobile && (mobile.any || base.any)) { parts.push(`--cms-tx-m:${mobile.tx}px`, `--cms-ty-m:${mobile.ty}px`, `--cms-sc-m:${mobile.sc}`, `--cms-rot-m:${mobile.rot}deg`); xf = xfm = true; }
  return parts.length ? ` style="${escapeAttribute(parts.join(';'))}"${xf ? ' data-cms-xf' : ''}${xfm ? ' data-cms-xf-m' : ''}` : '';
}

export const cmsPath = path => ` data-cms-path="${marker(path)}"`;
export const cmsImagePath = path => ` data-cms-image-path="${marker(path)}"`;
export const visualHelpers = data => ({
  T: path => textStyleAttr(getPath(data, styleBasePathFor(path))) + cmsPath(path),
  I: cmsImagePath
});
export const isVideoUrl = isVideoMedia;
export const VIDEO_OK = '';

export function media(value, opts = {}) {
  // Some original modules already pass an escaped safeAsset value.
  const url = normalizeMedia(String(value || '').replaceAll('&amp;', '&'));
  const cls = String(opts.cls || '').replace(/[^A-Za-z0-9 _-]/g, '');
  const attrs = String(opts.attrs || '').match(/ data-cms-image-path="content(?:\.(?:[A-Za-z_]\w*|\d+))+"/g)?.join('') || '';
  if (isVideoMedia(url)) return `<video class="cms-media ${cls}"${attrs} src="${escapeAttribute(url)}" autoplay muted loop playsinline preload="metadata"></video>`;
  return `<img${cls ? ` class="${cls}"` : ''}${attrs} src="${escapeAttribute(url)}" alt="${escapeAttribute(opts.alt || '')}">`;
}
