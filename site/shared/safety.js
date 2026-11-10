import { SITE_CONFIG } from '../config.js';
import { LEGACY_MEDIA } from './legacy-media.js';

const PUBLIC_API = 'https://pvwktijtqtmvnqofuwro.supabase.co/functions/v1/cms-production-api';
const MEDIA_ID = /^[a-f0-9]{64}(?:\.(?:png|jpe?g|webp|gif|avif|svg|ico|mp4|webm))?$/;
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const mediaTypes = new Map();

export const escapeAttribute = value => String(value ?? '').replace(/[&<>"']/g,
  c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function locationUrl() {
  return globalThis.location?.href || 'https://1116maehira-ai.github.io/setsubigiken-cms-review/';
}

export function apiUrl(path = SITE_CONFIG.sitePath) {
  const base = new URL(SITE_CONFIG.apiBase.replace(/\/$/, '') + '/', locationUrl());
  const result = new URL(String(path).replace(/^\//, ''), base);
  if (result.origin !== base.origin || !result.pathname.startsWith(base.pathname)) throw new Error('表示先の設定を確認できません。');
  return result.href;
}

export function normalizeMedia(value) {
  if (typeof value !== 'string' || !value || value.length > 2048) return '';
  if (value === './assets/send-paper-plane.png') return value;
  let candidate;
  try { candidate = new URL(value, locationUrl()); } catch { return ''; }
  if (candidate.username || candidate.password || candidate.search || candidate.hash) return '';
  if (LEGACY_MEDIA.has(candidate.href)) return candidate.href;
  const prefixes = [PUBLIC_API + '/media/', apiUrl('/media/')];
  if (SITE_CONFIG.mediaBase) {
    const proxy = new URL(SITE_CONFIG.mediaBase, locationUrl());
    if (proxy.origin !== new URL(locationUrl()).origin) return '';
    prefixes.push(proxy.href.replace(/\/?$/, '/'));
  }
  let id = null;
  for (const prefix of prefixes) if (candidate.href.startsWith(prefix)) {
    const tail = candidate.href.slice(prefix.length);
    if (MEDIA_ID.test(tail)) { id = tail; break; }
  }
  if (!id) return '';
  if (SITE_CONFIG.mediaBase) return new URL(id, new URL(SITE_CONFIG.mediaBase.replace(/\/?$/, '/'), locationUrl())).href;
  return candidate.href;
}

export const safeAsset = value => escapeAttribute(normalizeMedia(value));

export function setMediaTypes(values = {}) {
  mediaTypes.clear();
  if (!values || typeof values !== 'object') return;
  for (const [url, type] of Object.entries(values)) {
    const safe = normalizeMedia(url);
    if (safe && /^(?:image\/(?:png|jpeg|webp|gif|avif|svg\+xml|x-icon|vnd\.microsoft\.icon)|video\/(?:mp4|webm))$/.test(type)) mediaTypes.set(safe, type);
  }
}

export function isVideoMedia(value) {
  const safe = normalizeMedia(value);
  return !!safe && (mediaTypes.get(safe)?.startsWith('video/') || /\.(?:mp4|webm)$/.test(safe));
}

export function finite(value, fallback = 0, min = -10000, max = 10000) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}

export function validColor(value) {
  const v = String(value ?? '').trim();
  if (!v || v.length > 80 || /[;{}<>"'\\]|url\s*\(|expression\s*\(/i.test(v)) return '';
  if (/^#[0-9a-f]{3,8}$/i.test(v) || /^(?:transparent|currentColor|black|white|red|blue|green|yellow|gray|grey)$/i.test(v)) return v;
  if (/^(?:rgb|hsl)a?\([\d\s.,%+-]+\)$/i.test(v)) return v;
  return '';
}

function clean(value, depth = 0, key = '', mediaField = false) {
  if (depth > 15) throw new Error('表示データの構造を確認できません。');
  if (Array.isArray(value)) {
    if (value.length > 1000) throw new Error('表示データが大きすぎます。');
    return value.map(x => clean(x, depth + 1));
  }
  if (value && typeof value === 'object') {
    const result = {};
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(k) || k.length > 200) continue;
      result[k] = clean(v, depth + 1, k, /(?:image|photo|icon|graphic|logo|src)$/i.test(k) || k === 'handwritten');
    }
    return result;
  }
  if (typeof value === 'string') {
    if (value.length > 150000) throw new Error('表示する文章が大きすぎます。');
    return mediaField ? normalizeMedia(value) : value;
  }
  if (typeof value === 'number') return finite(value);
  if (typeof value === 'boolean' || value === null) return value;
  return null;
}

export function prepareSite(payload) {
  if (!payload || typeof payload !== 'object' || !payload.sections || Array.isArray(payload.sections)) throw new Error('採用サイトの内容を読み込めませんでした。');
  setMediaTypes(payload.mediaTypes);
  const sections = {};
  for (let i = 1; i <= 12; i++) {
    const key = `section-${String(i).padStart(2, '0')}`;
    const source = payload.sections[key];
    if (!source || !source.content || typeof source.content !== 'object' || Array.isArray(source.content)) throw new Error('採用サイトの内容を確認中です。');
    const c = clean(source.content);
    sections[key] = {
      sectionKey: key, content: c, style: clean(source.style || {}), _v2: clean(source._v2 || {}),
      enabled: source.enabled !== false, sortOrder: finite(source.sortOrder, i, 1, 120),
      revision: finite(source.revision, 0, 0, Number.MAX_SAFE_INTEGER)
    };
  }
  return {
    sections, share: clean(payload.share || {}), revision: finite(payload.revision, 0, 0, Number.MAX_SAFE_INTEGER),
    updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : '', applicationsEnabled: false
  };
}
