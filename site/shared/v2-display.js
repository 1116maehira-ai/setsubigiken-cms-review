// Taira's saved display formatting, isolated from trial.js and all editor behavior.
// Rich text is rebuilt with text nodes and validated style properties, never HTML.
import { finite, validColor } from './safety.js';

const applied = new WeakMap();
const getPath = (obj, path) => String(path).split('.').reduce((v, k) => v?.[k], obj);

function setStyle(root, el, property, value) {
  let nodes = applied.get(root); if (!nodes) { nodes = new Map(); applied.set(root, nodes); }
  let props = nodes.get(el); if (!props) { props = new Map(); nodes.set(el, props); }
  if (!props.has(property)) props.set(property, [el.style.getPropertyValue(property), el.style.getPropertyPriority(property)]);
  el.style.setProperty(property, String(value));
}

export function restoreV2(root) {
  for (const [el, props] of applied.get(root) || []) {
    for (const [name, [value, priority]] of props) {
      if (value) el.style.setProperty(name, value, priority); else el.style.removeProperty(name);
    }
    el.__sitePan = null;
  }
  applied.delete(root);
}

function formatFor(v2, mode, path) {
  const own = v2.format?.[mode]?.[path] || {};
  const other = v2.format?.[mode === 'mobile' ? 'desktop' : 'mobile']?.[path] || {};
  const result = { ...own };
  for (const k of ['color', 'bold', 'underline']) if (!(k in result) && k in other) result[k] = other[k];
  return result;
}

export function richSegments(text, ranges) {
  text = String(text);
  const accepted = [];
  for (const range of Array.isArray(ranges) ? ranges.slice(0, 300) : []) {
    if (!range || typeof range.text !== 'string' || !range.text) continue;
    let start = Math.floor(finite(range.start, 0, 0, text.length));
    if (text.slice(start, start + range.text.length) !== range.text) {
      let best = -1, at = text.indexOf(range.text);
      while (at !== -1) { if (best === -1 || Math.abs(at - start) < Math.abs(best - start)) best = at; at = text.indexOf(range.text, at + 1); }
      start = best;
    }
    if (start < 0) continue;
    accepted.push({start, end:start + range.text.length, style: range.style || {}});
  }
  const cuts = [...new Set([0, text.length, ...accepted.flatMap(r => [r.start, r.end])])].sort((a,b) => a-b);
  return cuts.slice(0, -1).map((start, i) => ({
    text: text.slice(start, cuts[i + 1]),
    style: Object.assign({}, ...accepted.filter(r => r.start <= start && r.end >= cuts[i + 1]).map(r => r.style))
  }));
}

function appendText(parent, text) {
  const lines = String(text).split('\n');
  lines.forEach((line, i) => { if (i) parent.append(document.createElement('br')); parent.append(document.createTextNode(line)); });
}

function applyRich(el, text, ranges) {
  const key = JSON.stringify([text, ranges || []]);
  if (el.__siteRichKey === key) return;
  if (!ranges?.length && el.__siteRichKey === undefined) return;
  const fragment = document.createDocumentFragment();
  for (const segment of richSegments(text, ranges)) {
    const s = segment.style;
    if (!Object.keys(s).length) { appendText(fragment, segment.text); continue; }
    const span = document.createElement('span');
    const color = validColor(s.color), marker = validColor(s.marker);
    if (color) span.style.color = color;
    if (s.size != null) span.style.fontSize = finite(s.size, 16, 8, 200) + 'px';
    if (s.bold) span.style.fontWeight = '800';
    if (s.underline) { span.style.textDecoration = 'underline'; span.style.textUnderlineOffset = '.15em'; }
    if (marker) span.style.background = `linear-gradient(transparent 58%,${marker} 58%)`;
    appendText(span, segment.text); fragment.append(span);
  }
  el.replaceChildren(fragment); el.__siteRichKey = key;
}

const supportsViewBox = () => !!globalThis.CSS?.supports?.('object-view-box', 'inset(0px 0px 0px 0px)');
let resizeObserver;
function observeImage(el) {
  if (!globalThis.ResizeObserver) return;
  resizeObserver ??= new ResizeObserver(entries => { for (const {target} of entries) if (target.isConnected && target.__sitePan) applyImage(...target.__sitePan); });
  resizeObserver.observe(el);
}

function applyImage(root, el, values, path) {
  const x = finite(values.x, 0, -2000, 2000), y = finite(values.y, 0, -2000, 2000), zoom = finite(values.zoom, 1, .05, 20);
  const panPhoto = !/(?:icon|handwritten|graphic|logo)(?:\.|$)/i.test(path);
  if (values.radius != null) setStyle(root, el, 'border-radius', finite(values.radius, 0, 0, 500) + 'px');
  if (values.opacity != null) setStyle(root, el, 'opacity', finite(values.opacity, 1, 0, 1));
  if (!panPhoto || !supportsViewBox() || el.tagName !== 'IMG') {
    setStyle(root, el, 'translate', `${x}px ${y}px`); setStyle(root, el, 'scale', zoom); setStyle(root, el, 'transform-origin', 'center center'); return;
  }
  setStyle(root, el, 'translate', ''); setStyle(root, el, 'scale', '');
  if (!x && !y && zoom === 1) { setStyle(root, el, 'object-view-box', ''); return; }
  el.__sitePan = [root, el, values, path]; observeImage(el);
  if (!el.complete || !el.naturalWidth) {
    if (!el.__sitePanLoad) { el.__sitePanLoad = true; el.addEventListener('load', () => { if (el.__sitePan) applyImage(...el.__sitePan); }); }
    return;
  }
  const css = getComputedStyle(el), width = parseFloat(css.width), height = parseFloat(css.height);
  if (!(width > 1 && height > 1)) return;
  const nw = el.naturalWidth, nh = el.naturalHeight, ratio = width / height;
  const parts = String(css.objectPosition || '50% 50%').split(/\s+/).map(v => v.endsWith('%') ? parseFloat(v)/100 : /^(?:left|top)$/.test(v) ? 0 : /^(?:right|bottom)$/.test(v) ? 1 : .5);
  const px = parts[0] ?? .5, py = parts[1] ?? .5, frame = {x:0, y:0, w:nw, h:nh};
  if (css.objectFit === 'cover') {
    if (nw / nh > ratio) { frame.w = nh * ratio; frame.x = (nw-frame.w)*px; }
    else { frame.h = nw / ratio; frame.y = (nh-frame.h)*py; }
  } else if (css.objectFit === 'contain' || css.objectFit === 'scale-down') {
    if (nw / nh > ratio) { frame.h = nw / ratio; frame.y = (nh-frame.h)*py; }
    else { frame.w = nh * ratio; frame.x = (nw-frame.w)*px; }
  }
  const z = css.objectFit === 'cover' ? Math.max(1, zoom) : zoom, w = frame.w/z, h=frame.h/z;
  let cx=frame.x+frame.w/2-x*w/width, cy=frame.y+frame.h/2-y*h/height;
  if (css.objectFit === 'cover') { cx=Math.max(w/2,Math.min(nw-w/2,cx)); cy=Math.max(h/2,Math.min(nh-h/2,cy)); }
  setStyle(root, el, 'object-view-box', `inset(${cy-h/2}px ${nw-cx-w/2}px ${nh-cy-h/2}px ${cx-w/2}px)`);
}

export function applyV2(root, data, mode) {
  const v2 = data._v2 || {};
  for (const el of root.querySelectorAll('[data-cms-path]')) {
    const path=el.dataset.cmsPath, f=formatFor(v2, mode, path), color=validColor(f.color);
    if (f.size != null) setStyle(root, el, 'font-size', finite(f.size, 16, 8, 200) + 'px');
    if (color) setStyle(root, el, 'color', color);
    if ('bold' in f) setStyle(root, el, 'font-weight', f.bold ? '800' : '');
    if ('underline' in f) setStyle(root, el, 'text-decoration', f.underline ? 'underline' : '');
    if (/^(?:left|right|center|justify|start|end)$/.test(String(f.align))) setStyle(root, el, 'text-align', f.align);
    if (f.lh != null) setStyle(root, el, 'line-height', finite(f.lh, 1.6, .5, 5));
    if (f.ls != null) setStyle(root, el, 'letter-spacing', finite(f.ls, 0, -1, 2) + 'em');
    if (f.dx || f.dy) {
      const original = getComputedStyle(el).transform;
      setStyle(root, el, 'transform', `translate(${finite(f.dx,0,-400,400)}px,${finite(f.dy,0,-400,400)}px)` + (original && original !== 'none' ? ' '+original : ''));
    }
    const text=getPath(data, path);
    if (typeof text === 'string') applyRich(el,text,f.rich);
  }
  for (const marker of root.querySelectorAll('[data-cms-image-path]')) {
    const path = marker.dataset.cmsImagePath, values=v2.images?.[mode]?.[path];
    if (!values || typeof values !== 'object') continue;
    const el = /^(?:IMG|VIDEO)$/.test(marker.tagName) ? marker : marker.querySelector('img,video');
    if (el) applyImage(root,el,values,path);
  }
  const background=v2.background?.[mode], section=root.querySelector('section');
  if (section && background?.brightness != null) setStyle(root, section, 'filter', `brightness(${finite(background.brightness,1,.5,1.5)})`);
}
