'use strict';
/* =====================================================================
   GattoBrowser 1.0 — browser leggero di GattoHub
   Core: stato, schede, GattoSearch, navigazione, home, cronologia, menu
   ===================================================================== */

const CONFIG = {
  hub: 'https://gattoita-lab.github.io/GattoHub/',
  chat: 'https://private-smart-meow-chat.base44.app/',
  news: 'https://news.google.com/?hl=it&gl=IT&ceid=IT:it',
  repo: 'https://github.com/gattoitA-lab/GattoBrowser',
  issues: 'https://github.com/gattoitA-lab/GattoBrowser/issues',
  version: '1.0.0'
};

const LOGO_SVG = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3l11 6v14l-11 6-11-6V9z" fill="#04140a"/><path d="M16 8l7 4v9l-7 4-7-4v-9z" fill="#eafff2"/><circle cx="16" cy="16" r="2.6" fill="#04140a"/></svg>';

const ENGINES = {
  gatto: { label: 'GattoSearch', tag: 'di GattoHub', build: null },
  google: { label: 'Google', tag: 'esterno', build: (q) => 'https://www.google.com/search?q=' + encodeURIComponent(q) },
  bing: { label: 'Bing', tag: 'esterno', build: (q) => 'https://www.bing.com/search?q=' + encodeURIComponent(q) },
  duckduckgo: { label: 'DuckDuckGo', tag: 'esterno', build: (q) => 'https://duckduckgo.com/?q=' + encodeURIComponent(q) },
  wikipedia: { label: 'Wikipedia', tag: 'enciclopedia', build: (q) => 'https://it.wikipedia.org/w/index.php?search=' + encodeURIComponent(q) },
  youtube: { label: 'YouTube', tag: 'video', build: (q) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q) },
  github: { label: 'GitHub', tag: 'codice', build: (q) => 'https://github.com/search?q=' + encodeURIComponent(q) }
};

const DEFAULT_HOME_LINKS = [
  { title: 'GattoHub', url: CONFIG.hub },
  { title: 'PlayHub', url: CONFIG.hub },
  { title: 'Google News', url: CONFIG.news },
  { title: 'Wikipedia', url: 'https://it.wikipedia.org/' },
  { title: 'YouTube', url: 'https://www.youtube.com/' }
];

const DEFAULT_SETTINGS = {
  profileName: 'Francy', profileEmail: 'francypanda2014@gmail.com',
  theme: 'dark', accent: '#00ff66', fontSize: 14, animations: true,
  highContrast: false, largeCaret: false, reducedMotion: false,
  searchEngine: 'gatto', suggestions: true, resultsNewTab: false,
  guard: true, guardLevel: 'medio', blockPopups: true, clearOnExit: false, doNotTrack: true,
  memorySaver: true, memorySaverMinutes: 5, savingsMode: false, prefetch: true, autoExternal: true,
  autofill: true, saveForms: true, savedIdentities: [],
  aiEnabled: true, autoCopyShot: true, aiTarget: CONFIG.chat, aiModel: 'meow-smart',
  startup: 'home', startupLinks: [],
  language: 'it', translateTarget: 'it', translateSites: false,
  askDownloadLocation: false, openPdfExternal: true,
  showBookmarksBar: true, zoom: 100,
  bookmarks: [{ title: 'GattoHub', url: CONFIG.hub }],
  homeLinks: DEFAULT_HOME_LINKS.slice(),
  homeBg: { type: 'gradient', value: '' },
  lists: [], groups: [],
  extensions: { guard: true, popups: true, dark: false, quicknote: true, ai: true, reader: true },
  history: [], downloads: []
};

const LS_KEY = 'gattobrowser.settings.v1';
const SESSION_KEY = 'gattobrowser.session.v1';

let S = DEFAULT_SETTINGS;
const state = { tabs: [], active: null, seq: 1 };

/* ------------------------------- utils ------------------------------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function cloneSettings(obj) {
  return JSON.parse(JSON.stringify(obj));
}
function deepMerge(base, extra) {
  const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
  if (!extra || typeof extra !== 'object') return out;
  Object.keys(extra).forEach((k) => {
    const b = out[k], e = extra[k];
    if (Array.isArray(e)) out[k] = e;
    else if (b && e && typeof b === 'object' && typeof e === 'object') out[k] = deepMerge(b, e);
    else if (e !== undefined) out[k] = e;
  });
  return out;
}
function getPath(obj, path) {
  return String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj, path, val) {
  const parts = String(path).split('.');
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof o[parts[i]] !== 'object' || o[parts[i]] === null) o[parts[i]] = {};
    o = o[parts[i]];
  }
  o[parts[parts.length - 1]] = val;
}
function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return cloneSettings(DEFAULT_SETTINGS);
    return deepMerge(cloneSettings(DEFAULT_SETTINGS), JSON.parse(raw));
  } catch (e) {
    return cloneSettings(DEFAULT_SETTINGS);
  }
}
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(S)); }
  catch (e) { /* quota piena: le impostazioni restano in memoria */ }
}
function saveSetting(key, val) { setPath(S, key, val); save(); }

function toast(msg, kind, ms) {
  const box = $('#toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + (kind || '');
  t.innerHTML = '<span>' + esc(msg) + '</span>';
  box.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(6px)'; t.style.transition = 'all .2s'; }, (ms || 3200));
  setTimeout(() => t.remove(), (ms || 3200) + 240);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function normalizeUrl(input) {
  let u = String(input || '').trim();
  if (!u) return '';
  if (/^(https?:|about:|data:|file:)/i.test(u)) return u;
  if (/^(localhost|127\.0\.0\.1|192\.168\.[\d.]+)(:\d+)?(\/|$)/i.test(u)) return 'http://' + u;
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?([\/?#].*)?$/.test(u)) return 'https://' + u;
  return 'https://' + u;
}
function isUrlLike(v) {
  const s = String(v || '').trim();
  if (!s) return false;
  if (/^https?:\/\//i.test(s)) return true;
  if (/\s/.test(s)) return false;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(s)) return true;
  return /^[\w-]+(\.[a-z]{2,})(:\d+)?([\/?#].*)?$/i.test(s);
}
function prettyHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch (e) { return url; }
}
function hostOf(url) {
  try { return new URL(url).hostname; } catch (e) { return ''; }
}
function favLetter(title) {
  const t = String(title || '?').trim();
  return t ? t[0].toUpperCase() : '?';
}
function fmtTime(ts) {
  try { return new Date(ts).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch (e) { return ''; }
}
function bytes(n) {
  if (!n) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0, v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return v.toFixed(v < 10 && i > 0 ? 1 : 0) + ' ' + u[i];
}

/* ------------------------------ settings ------------------------------ */
function resolveTheme() {
  if (S.theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return S.theme;
}
function applySettings() {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme();
  root.style.setProperty('--accent', S.accent || '#00ff66');
  root.style.setProperty('--accent-soft', hexAlpha(S.accent || '#00ff66', 0.15));
  document.body.classList.toggle('no-anim', !S.animations || S.reducedMotion);
  document.body.classList.toggle('high-contrast', !!S.highContrast);
  document.body.classList.toggle('big-caret', !!S.largeCaret);
  document.body.classList.toggle('dark-sites', !!S.extensions.dark);
  $('#bookmarksbar').classList.toggle('hidden', !S.showBookmarksBar);
  $('#guardState').textContent = S.guard ? 'GattoGuard attivo' : 'GattoGuard disattivato';
  $('#guardState').className = S.guard ? 'ok hide-sm' : 'off hide-sm';
  $('#omniChip').classList.toggle('hidden', false);
  $('#omniChip').classList.toggle('guard-on', !!S.guard);
  $('#omniChip').title = S.guard ? 'GattoGuard: protezione attiva' : 'GattoGuard: protezione disattivata';
  $('#omniChip').textContent = S.guard ? '🛡' : '⚠';
  $('#shotBtn').classList.toggle('hidden', !S.aiEnabled);
  setZoom(S.zoom, false);
  renderBookmarksBar();
  document.body.style.fontSize = S.fontSize + 'px';
}
function hexAlpha(hex, a) {
  const h = String(hex).replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

/* ------------------------------- tabs -------------------------------- */
const getTab = (id) => state.tabs.find((t) => t.id === id);
const activeTab = () => getTab(state.active);
const currentUrl = () => { const t = activeTab(); return t && t.kind === 'web' ? t.url : ''; };

function kindTitle(kind) {
  return { home: 'Nuova scheda', search: 'GattoSearch', web: 'Pagina', news: 'Notizie', history: 'Cronologia', downloads: 'Download', bookmarks: 'Preferiti', settings: 'Impostazioni', blocked: 'Pagina bloccata' }[kind] || 'Scheda';
}
function favFor(tab) {
  switch (tab.kind) {
    case 'home': return '🐱';
    case 'search': return '🔍';
    case 'news': return '📰';
    case 'history': return '🕘';
    case 'downloads': return '⬇';
    case 'bookmarks': return '☆';
    case 'settings': return '⚙';
    case 'blocked': return '🛡';
    default: return favLetter(prettyHost(tab.url));
  }
}

function createTab(kind, opts) {
  const o = opts || {};
  const tab = {
    id: 't' + (state.seq++),
    kind: kind || 'home',
    title: o.title || kindTitle(kind || 'home'),
    url: o.url || '',
    query: o.query || '',
    pane: null,
    history: [],
    hIndex: -1,
    lastActive: Date.now(),
    suspended: false,
    bypass: false
  };
  if (kind === 'web' && o.url) { tab.history = [normalizeUrl(o.url)]; tab.hIndex = 0; }
  state.tabs.push(tab);
  activateTab(tab.id);
  return tab;
}

function closeTab(id) {
  const idx = state.tabs.findIndex((t) => t.id === id);
  if (idx < 0) return;
  const tab = state.tabs[idx];
  if (tab.pane) tab.pane.remove();
  state.tabs.splice(idx, 1);
  if (!state.tabs.length) { createTab('home'); return; }
  if (state.active === id) {
    const next = state.tabs[Math.max(0, idx - 1)];
    activateTab(next.id);
  } else {
    renderTabs();
  }
  saveSession();
}

function activateTab(id) {
  const tab = getTab(id);
  if (!tab) return;
  state.active = id;
  tab.lastActive = Date.now();
  if (!tab.pane) renderPane(tab);
  $$('#view .pane').forEach((p) => p.classList.toggle('active', p.dataset.tab === id));
  if (tab.suspended) resumeTab(tab);
  renderTabs();
  syncToolbar();
  saveSession();
}

function renderTabs() {
  const box = $('#tabs');
  box.innerHTML = state.tabs.map((t) =>
    '<div class="tab ' + (t.id === state.active ? 'active' : '') + '" data-act="activetab" data-id="' + t.id + '" role="tab" title="' + esc(t.title) + '">' +
      '<span class="fav">' + esc(favFor(t)) + '</span>' +
      '<span class="ttl">' + esc(t.title) + '</span>' +
      '<button class="x" data-act="closetab" data-id="' + t.id + '" title="Chiudi scheda">×</button>' +
    '</div>'
  ).join('');
}

function renderPane(tab) {
  const pane = document.createElement('div');
  pane.className = 'pane';
  pane.dataset.tab = tab.id;
  $('#view').appendChild(pane);
  tab.pane = pane;
  $$('#view .pane').forEach((p) => p.classList.toggle('active', p === pane));
  switch (tab.kind) {
    case 'home': buildHome(tab); break;
    case 'search': buildSearch(tab); break;
    case 'web': buildWeb(tab); break;
    case 'blocked': buildBlocked(tab); break;
    case 'news': buildNews(tab); break;
    case 'history': buildHistory(tab); break;
    case 'downloads': buildDownloads(tab); break;
    case 'bookmarks': buildBookmarks(tab); break;
    case 'settings': buildSettings(tab); break;
    default: buildHome(tab);
  }
  return pane;
}

function refreshTab(tab) {
  if (!tab) return;
  if (tab.pane) { tab.pane.remove(); tab.pane = null; }
  renderPane(tab);
  renderTabs();
  syncToolbar();
}

function syncToolbar() {
  const tab = activeTab();
  const omni = $('#omni');
  if (tab && tab.kind === 'web' && tab.url) omni.value = tab.url;
  else if (tab && tab.kind === 'search') omni.value = tab.query;
  else omni.value = '';
  $('#omniIcon').textContent = tab && tab.kind === 'web' ? '🔒' : '🔍';
  const isBm = !!(tab && tab.url && S.bookmarks.some((b) => b.url === tab.url));
  $('#star').textContent = isBm ? '★' : '☆';
  $('#star').classList.toggle('on', isBm);
  const canBack = !!(tab && tab.kind === 'web' && tab.hIndex > 0);
  $('#back').disabled = !canBack;
  $('#fwd').disabled = !(tab && tab.kind === 'web' && tab.hIndex < tab.history.length - 1);
  $('#zoomInfo').textContent = S.zoom + '%';
}

function updateNavBtns() { syncToolbar(); }

/* ---------------------------- navigation ----------------------------- */
const EMBED_BLOCKERS = [
  /^https?:\/\/(www\.)?google\./i, /^https?:\/\/news\.google\./i, /^https?:\/\/accounts\.google\./i, /^https?:\/\/mail\.google\./i,
  /^https?:\/\/(www\.)?youtube\.com/i, /^https?:\/\/m\.youtube\.com/i, /^https?:\/\/youtu\.be/i,
  /^https?:\/\/(www\.)?facebook\./i, /^https?:\/\/(www\.)?instagram\./i, /^https?:\/\/(www\.)?threads\./i,
  /^https?:\/\/(x|twitter)\.com/i, /^https?:\/\/(www\.)?amazon\./i, /^https?:\/\/(www\.)?netflix\./i,
  /^https?:\/\/(www\.)?tiktok\./i, /^https?:\/\/(www\.)?whatsapp\./i, /^https?:\/\/(www\.)?microsoft\./i,
  /^https?:\/\/(www\.)?apple\.com/i, /^https?:\/\/(www\.)?mozilla\./i,
  /^https?:\/\/(www\.)?reddit\.com/i, /^https?:\/\/(www\.)?linkedin\.com/i, /^https?:\/\/pinterest\./i,
  /^https?:\/\/(www\.)?discord\.com/i, /^https?:\/\/(open\.)?spotify\.com/i, /^https?:\/\/web\.telegram\.org/i,
  /^https?:\/\/(www\.)?twitch\.tv\/?$/i, /^https?:\/\/(www\.)?primevideo\./i, /^https?:\/\/(www\.)?disneyplus\./i,
  /^https?:\/\/(www\.)?ebay\./i, /^https?:\/\/(www\.)?paypal\./i, /^https?:\/\/(www\.)?notion\.so/i,
  /^https?:\/\/(chatgpt\.com|chat\.openai\.com)/i, /^https?:\/\/chat\.deepseek\.com/i, /^https?:\/\/(www\.)?canva\.com/i
];

/* YouTube blocca l'incorporamento delle pagine normali, ma il player /embed/ è fatto apposta */
function youtubeId(url) {
  try {
    const u = new URL(url);
    const isYT = /(^|\.)youtube\.com$|(^|\.)youtube-nocookie\.com$/i.test(u.hostname);
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      return id && /^[\w-]{6,}$/.test(id) ? id : null;
    }
    if (!isYT) return null;
    if (u.pathname === '/watch') {
      const v = u.searchParams.get('v');
      return v && /^[\w-]{6,}$/.test(v) ? v : null;
    }
    const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([\w-]{6,})/);
    return m ? m[2] : null;
  } catch (e) { return null; }
}

function isExternalOnly(url) {
  if (youtubeId(url)) return false; // il player è incorporabile
  return EMBED_BLOCKERS.some((rx) => rx.test(url));
}

function navigate(tab, rawUrl, opts) {
  const o = opts || {};
  const url = normalizeUrl(rawUrl);
  if (!url) return;
  const g = guardCheck(url);
  tab.url = url;
  tab.bypass = !!o.bypass;
  tab.blocked = (!g.ok && !o.bypass) ? g : null;
  tab.kind = tab.blocked ? 'blocked' : 'web';
  tab.title = prettyHost(url);
  tab.suspended = false;
  if (!o.replace) {
    tab.history = tab.history.slice(0, tab.hIndex + 1);
    tab.history.push(url);
    tab.hIndex = tab.history.length - 1;
  }
  if (tab.pane) { tab.pane.remove(); tab.pane = null; }
  renderPane(tab);
  renderTabs();
  syncToolbar();
  if (!tab.blocked) pushHistory(url, tab.title);
  saveSession();
}

function openUrl(rawUrl, opts) {
  const o = opts || {};
  const tab = o.newTab ? createTab('web', { url: normalizeUrl(rawUrl) }) : (activeTab() || createTab('home'));
  if (!tab) return;
  if (o.newTab) { tab.history = []; tab.hIndex = -1; }
  navigate(tab, rawUrl, o);
  return tab;
}

function back() {
  const tab = activeTab();
  if (!tab || tab.kind !== 'web' || tab.hIndex <= 0) return;
  tab.hIndex--;
  navigate(tab, tab.history[tab.hIndex], { replace: true });
}
function forward() {
  const tab = activeTab();
  if (!tab || tab.kind !== 'web' || tab.hIndex >= tab.history.length - 1) return;
  tab.hIndex++;
  navigate(tab, tab.history[tab.hIndex], { replace: true });
}
function reload() {
  const tab = activeTab();
  if (!tab) return;
  if (tab.kind === 'blocked') { navigate(tab, tab.url, { bypass: tab.bypass }); return; }
  if (tab.kind === 'web') { navigate(tab, tab.url, { replace: true }); toast('Pagina ricaricata'); }
  else { refreshTab(tab); }
}

/* history (dati) */
function pushHistory(url, title) {
  if (!url || /^about:/i.test(url)) return;
  S.history.unshift({ url, title: title || prettyHost(url), date: Date.now() });
  S.history = S.history.slice(0, 400);
  save();
}
function clearHistory() { S.history = []; save(); }

/* bookmarks bar */
function renderBookmarksBar() {
  const bar = $('#bookmarksbar');
  const list = S.bookmarks.slice(0, 24);
  bar.innerHTML = list.length
    ? list.map((b) => '<a class="bm" href="' + esc(b.url) + '" data-act="open-url" data-url="' + esc(b.url) + '" title="' + esc(b.url) + '"><span class="dot">' + esc(favLetter(b.title)) + '</span><span>' + esc(b.title) + '</span></a>').join('')
    : '<span class="empty">Nessun preferito: premi ☆ nella barra per aggiungerne uno.</span>';
}

function toggleBookmark() {
  const tab = activeTab();
  if (!tab || !tab.url) { toast('Apri una pagina per aggiungerla ai preferiti'); return; }
  const i = S.bookmarks.findIndex((b) => b.url === tab.url);
  if (i >= 0) { S.bookmarks.splice(i, 1); toast('Rimosso dai preferiti'); }
  else { S.bookmarks.unshift({ title: tab.title || prettyHost(tab.url), url: tab.url }); toast('Aggiunto ai preferiti', 'ok'); }
  save();
  renderBookmarksBar();
  syncToolbar();
  const st = state.tabs.find((t) => t.kind === 'settings');
  if (st) refreshTab(st);
}

/* ------------------------------- home -------------------------------- */
function homeBgHTML() {
  const bg = S.homeBg || { type: 'gradient' };
  const value = bg.value || '';
  if (bg.type === 'file' && S._bgObjectUrl) {
    if ((bg.mime || '').indexOf('video') === 0) return '<video class="home-bg" src="' + S._bgObjectUrl + '" autoplay muted loop playsinline></video>';
    return '<img class="home-bg" src="' + S._bgObjectUrl + '" alt="">';
  }
  if ((bg.type === 'url' || bg.type === 'file') && value) {
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(value)) return '<video class="home-bg" src="' + esc(value) + '" autoplay muted loop playsinline></video>';
    return '<img class="home-bg" src="' + esc(value) + '" alt="">';
  }
  return '';
}

function buildHome(tab) {
  const pane = tab.pane;
  const engine = ENGINES[S.searchEngine] || ENGINES.gatto;
  pane.innerHTML =
    '<div class="home">' +
      homeBgHTML() + '<div class="home-shade"></div>' +
      '<div class="home-inner">' +
        '<div class="brand-row">' +
          '<div class="logo">' + LOGO_SVG + '</div>' +
          '<div><div class="brand-name">GattoBrowser</div><div class="brand-sub">by GattoHub · v' + CONFIG.version + ' · ' + (S.guard ? 'GattoGuard ON' : 'protezione OFF') + '</div></div>' +
          '<div class="brand-actions">' +
            '<button class="mini-btn" data-act="run" data-run="install">⤓ Installa app</button>' +
            '<button class="mini-btn" data-act="open-settings" data-sec="look">Personalizza</button>' +
            '<button class="mini-btn solid" data-act="open-settings" data-sec="account">Impostazioni</button>' +
          '</div>' +
        '</div>' +
        '<button class="playhub" data-act="playhub">' +
          '<span class="ph-orb">▶</span>' +
          '<span class="ph-txt"><b>Entra su PlayHub</b><small>Animazione di ingresso e via: giochi, app e minigiochi di GattoHub</small></span>' +
          '<span class="ph-go">Entra →</span>' +
        '</button>' +
        '<form class="home-search" id="homeSearchForm" autocomplete="off">' +
          '<input id="homeSearchInput" type="text" placeholder="Cerca con ' + esc(engine.label) + ' o incolla un indirizzo" aria-label="Ricerca">' +
          '<button class="go" type="submit" aria-label="Cerca">⌕</button>' +
        '</form>' +
        '<div class="engines">' +
          Object.keys(ENGINES).map((k) => '<button type="button" data-act="pick-engine" data-engine="' + k + '" class="' + (S.searchEngine === k ? 'on' : '') + '">' + esc(ENGINES[k].label) + '</button>').join('') +
        '</div>' +
        '<section>' +
          '<div class="sec-head"><h3>I tuoi collegamenti</h3><span class="hint">' + S.homeLinks.length + ' salvati</span>' +
            '<button class="act" data-act="loginLinks">+ Aggiungi link</button>' +
            '<button class="act" data-act="bg-edit">🖼 Sfondo</button>' +
          '</div>' +
          '<div class="home-links">' +
            S.homeLinks.map((l, i) =>
              '<a class="link-card" href="' + esc(l.url) + '" data-act="open-url" data-url="' + esc(l.url) + '" title="' + esc(l.url) + '">' +
                '<span class="fav-ic">' + esc(l.title[0] ? l.title[0].toUpperCase() : '?') + '</span>' +
                '<span class="nm">' + esc(l.title) + '</span>' +
                '<button class="del" data-act="del-home-link" data-i="' + i + '" title="Rimuovi">✕</button>' +
              '</a>').join('') +
            '<button class="link-add" data-act="add-home-link"><span style="font-size:20px">＋</span><span>Aggiungi</span></button>' +
          '</div>' +
        '</section>' +
        '<section>' +
          '<div class="sec-head"><h3>Notizie</h3><span class="hint">da Google News</span><button class="act" data-act="news-tab">Apri sezione →</button></div>' +
          '<div class="news-grid">' +
            newsCategories().slice(0, 4).map((n) =>
              '<button class="news-card" data-act="news-open" data-url="' + esc(n.url) + '"><b>' + esc(n.title) + '</b><small>' + esc(n.desc) + '</small><span class="tag">news.google.com →</span></button>'
            ).join('') +
          '</div>' +
        '</section>' +
        '<div style="font-size:11px;color:var(--muted);display:flex;gap:14px;flex-wrap:wrap;padding-top:4px">' +
          '<span>Screenshot → AI: premi 📷 in alto</span><a href="' + CONFIG.hub + '" data-act="open-url" data-url="' + CONFIG.hub + '">GattoHub</a>' +
          '<a href="#" data-act="open-settings" data-sec="default">Imposta come browser predefinito</a>' +
        '</div>' +
      '</div>' +
    '</div>';

  const form = $('#homeSearchForm', pane);
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      doSearch($('#homeSearchInput', pane).value);
    });
  }
  const input = $('#homeSearchInput', pane);
  if (input) input.addEventListener('input', () => showSuggest(input));
  if (input) input.addEventListener('blur', () => setTimeout(hideSuggest, 160));
}

function newsCategories() {
  const base = 'https://news.google.com/search?hl=it&gl=IT&ceid=IT:it&q=';
  return [
    { title: 'Ultime notizie', desc: 'Titoli principali in Italia', url: CONFIG.news, q: '' },
    { title: 'Tecnologia', desc: 'AI, telefoni, computer', url: base + encodeURIComponent('tecnologia'), q: 'tecnologia' },
    { title: 'Videogiochi', desc: 'Giochi e community', url: base + encodeURIComponent('videogiochi'), q: 'videogiochi' },
    { title: 'Sport', desc: 'Calcio e altro', url: base + encodeURIComponent('sport'), q: 'sport' },
    { title: 'Italia', desc: 'Cronaca e politica', url: base + encodeURIComponent('Italia'), q: 'Italia' },
    { title: 'Mondo', desc: 'Dal resto del pianeta', url: base + encodeURIComponent('mondo'), q: 'mondo' },
    { title: 'Intelligenza artificiale', desc: 'Novità AI', url: base + encodeURIComponent('intelligenza artificiale'), q: 'AI' },
    { title: "Scuola", desc: 'Maturità, università', url: base + encodeURIComponent('scuola'), q: 'scuola' }
  ];
}

function buildNews(tab) {
  const pane = tab.pane;
  pane.innerHTML =
    '<div class="page">' +
      '<h2>📰 Notizie</h2>' +
      '<p class="lead">Le categorie aprono Google News. GattoBrowser non copia le notizie: ti porta direttamente alla fonte, così resti sempre aggiornato.</p>' +
      '<div class="row"><button class="btn primary" data-act="news-open" data-url="' + esc(CONFIG.news) + '">Apri Google News →</button>' +
      '<button class="btn" data-act="news-open" data-url="https://news.google.com/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=it&gl=IT&ceid=IT:it">Top storie</button></div>' +
      '<div class="news-grid">' +
        newsCategories().map((n) =>
          '<button class="news-card" data-act="news-open" data-url="' + esc(n.url) + '"><b>' + esc(n.title) + '</b><small>' + esc(n.desc) + '</small><span class="tag">Google News →</span></button>'
        ).join('') +
      '</div>' +
    '</div>';
}

/* ------------------------------ web tab ------------------------------ */
function buildWeb(tab) {
  const pane = tab.pane;
  pane.innerHTML = '';

  /* Player YouTube: la pagina /watch non è incorporabile, il player si carica solo al clic */
  const ytId = youtubeId(tab.url);
  if (ytId) {
    const host = document.createElement('div');
    host.className = 'web-host';
    const note = document.createElement('div');
    note.className = 'embed-note';
    note.innerHTML = '▶ <b>Player YouTube</b> dentro GattoBrowser · ' + esc(tab.title || 'video') +
      '<button data-act="open-external" data-url="' + esc(tab.url) + '">Apri su YouTube ↗</button>';
    host.appendChild(note);
    const poster = document.createElement('div');
    poster.className = 'yt-poster';
    poster.style.backgroundImage = 'url("https://i.ytimg.com/vi/' + encodeURIComponent(ytId) + '/hqdefault.jpg")';
    const play = document.createElement('button');
    play.className = 'yt-play';
    play.type = 'button';
    play.innerHTML = '▶';
    play.title = 'Riproduci il video dentro GattoBrowser';
    play.onclick = () => {
      const frame = document.createElement('iframe');
      frame.src = 'https://www.youtube.com/embed/' + encodeURIComponent(ytId) + '?autoplay=1&rel=0';
      frame.title = 'YouTube: ' + (tab.title || ytId);
      frame.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
      frame.style.cssText = 'width:100%;height:100%;border:none;background:#000';
      poster.replaceWith(frame);
      tab.frame = frame;
    };
    poster.appendChild(play);
    host.appendChild(poster);
    pane.appendChild(host);
    tab.suspended = false;
    if (typeof renderCredentialBar === 'function') renderCredentialBar(tab);
    return;
  }

  /* Siti che vietano l'incorporamento: finestra dedicata (funziona davvero) */
  if (isExternalOnly(tab.url)) {
    buildExternalPane(tab);
    return;
  }

  const host = document.createElement('div');
  host.className = 'web-host';
  const frame = document.createElement('iframe');
  frame.src = tab.url;
  frame.title = tab.title || tab.url;
  frame.setAttribute('referrerpolicy', 'no-referrer');
  frame.setAttribute('allow', 'clipboard-write; fullscreen; autoplay; encrypted-media; picture-in-picture');
  if (S.blockPopups) {
    frame.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-modals allow-downloads allow-pointer-lock allow-presentation');
  }
  host.appendChild(frame);
  pane.appendChild(host);
  tab.frame = frame;
  tab.suspended = false;
  if (typeof renderCredentialBar === 'function') renderCredentialBar(tab);
  frame.addEventListener('load', () => {
    $('#statusMsg').textContent = 'Caricato: ' + prettyHost(tab.url);
  });
}

function openDedicatedWindow(url) {
  const w = window.open(url, '_blank', 'width=1200,height=860,menubar=yes,toolbar=yes');
  if (!w) toast('Popup bloccato: consenti le finestre e riprova', 'err', 5000);
  return !!w;
}

function buildExternalPane(tab) {
  const pane = tab.pane;
  const url = tab.url;
  const wrap = document.createElement('div');
  wrap.className = 'blocked';
  wrap.innerHTML =
    '<div class="card">' +
      '<div class="shield">↗</div>' +
      '<h2>Questo sito si apre in una finestra dedicata</h2>' +
      '<p><b>' + esc(prettyHost(url)) + '</b> impedisce di essere mostrato dentro altre pagine (X-Frame-Options). GattoBrowser lo apre in una finestra sua: si usa esattamente come un\'app, con login, video e tutto il resto funzionanti.</p>' +
      '<div class="url">' + esc(url) + '</div>' +
      '<div class="acts">' +
        '<button class="btn primary" data-open-here>Apri la finestra ↗</button>' +
        '<button class="btn" data-act="copy-link" data-url="' + esc(url) + '">Copia link</button>' +
        '<button class="btn" data-act="open-settings" data-sec="privacy">Impostazioni</button>' +
      '</div>' +
      '<div style="font-size:11.5px;color:var(--muted);max-width:100%">Apertura automatica: ' + (S.autoExternal ? 'attiva' : 'disattiva') + '. Puoi cambiarla in Impostazioni → Privacy.</div>' +
    '</div>';
  pane.appendChild(wrap);
  const open = () => openDedicatedWindow(url);
  const btn = wrap.querySelector('[data-open-here]');
  if (btn) btn.onclick = open;
  tab.openExternal = open;
  if (S.autoExternal && !tab.autoOpened && (typeof hasGesture !== 'function' || hasGesture())) {
    tab.autoOpened = true;
    open();
  }
}

function suspendTab(tab) {
  if (!tab || tab.kind !== 'web' || !tab.frame) return;
  if (tab.id === state.active) return;
  try { tab.frame.src = 'about:blank'; } catch (e) { /* noop */ }
  tab.suspended = true;
}
function resumeTab(tab) {
  if (!tab || !tab.suspended) return;
  tab.suspended = false;
  if (tab.frame) tab.frame.src = tab.url;
  else if (tab.kind === 'web') refreshTab(tab);
}

/* ----------------------------- blocked ------------------------------- */
function buildBlocked(tab) {
  const pane = tab.pane;
  const g = tab.blocked || { reasons: [], score: 0 };
  pane.innerHTML =
    '<div class="blocked"><div class="card">' +
      '<div class="shield">🛡</div>' +
      '<h2>GattoGuard ha bloccato questa pagina</h2>' +
      '<p>Il sito ha caratteristiche tipiche di truffe o download pericolosi. Rischio rilevato: <b>' + esc(g.score) + '/10</b> (livello ' + esc(S.guardLevel) + ').</p>' +
      '<div class="url">' + esc(tab.url) + '</div>' +
      '<ul>' + (g.reasons || []).map((r) => '<li>' + esc(r) + '</li>').join('') + '</ul>' +
      '<div class="acts">' +
        '<button class="btn primary" data-act="guard-back">← Torna al sicuro</button>' +
        '<button class="btn danger" data-act="guard-bypass">Vai comunque (rischioso)</button>' +
        '<button class="btn" data-act="open-settings" data-sec="privacy">Impostazioni protezione</button>' +
      '</div>' +
    '</div></div>';
}

/* ---------------------------- GattoSearch ---------------------------- */
function doSearch(query) {
  const q = String(query || '').trim();
  if (!q) return;
  if (isUrlLike(q) && !/\s/.test(q)) { openUrl(q); return; }
  const engineKey = S.searchEngine || 'gatto';
  const engine = ENGINES[engineKey];
  if (engineKey !== 'gatto' && engine && engine.build) {
    const url = engine.build(q);
    if (S.resultsNewTab) openUrl(url, { newTab: true });
    else openUrl(url);
    return;
  }
  hideSuggest();
  const tab = createTab('search', { query: q, title: 'GattoSearch: ' + q });
  return tab;
}

async function wikiSearch(q) {
  const url = 'https://it.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent(q) +
    '&gsrlimit=6&prop=extracts|pageimages&exintro=1&explaintext=1&exsentences=3&piprop=thumbnail&pithumbsize=120&format=json&origin=*';
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('wiki ' + r.status);
  const j = await r.json();
  const pages = (j && j.query && j.query.pages) ? Object.values(j.query.pages) : [];
  return pages.sort((a, b) => (a.index || 0) - (b.index || 0)).map((p) => ({
    title: p.title,
    snippet: p.extract || 'Voce di Wikipedia',
    url: 'https://it.wikipedia.org/wiki/' + encodeURIComponent(String(p.title).replace(/ /g, '_')),
    thumb: (p.thumbnail && p.thumbnail.source) || '',
    source: 'Wikipedia'
  }));
}

async function ddgSearch(q) {
  const r = await fetch('https://api.duckduckgo.com/?q=' + encodeURIComponent(q) + '&format=json&no_html=1&skip_disambig=1&no_redirect=1');
  if (!r.ok) throw new Error('ddg ' + r.status);
  const j = await r.json();
  const out = [];
  if (j.AbstractText) out.push({ title: j.Heading || q, snippet: j.AbstractText, url: j.AbstractURL || '', thumb: j.Image ? 'https://duckduckgo.com' + j.Image : '', source: 'DuckDuckGo', abstract: true });
  const walk = (arr) => (arr || []).forEach((t) => {
    if (t.FirstURL) out.push({ title: (t.Text || t.FirstURL).split(' - ')[0].slice(0, 110), snippet: t.Text || '', url: t.FirstURL, thumb: '', source: 'DuckDuckGo' });
    if (t.Topics) walk(t.Topics);
  });
  walk(j.RelatedTopics);
  return out.slice(0, 8);
}

async function buildSearch(tab) {
  const pane = tab.pane;
  const q = tab.query;
  pane.innerHTML =
    '<div class="sr">' +
      '<div class="sr-top"><span class="glogo">🐱 GattoSearch</span><span class="stats" id="srStats">ricerca in corso…</span></div>' +
      '<h2 class="sr-q">' + esc(q) + '</h2>' +
      '<div class="sr-tabs">' +
        '<button data-act="pick-engine" data-engine="gatto" class="' + (S.searchEngine === 'gatto' ? 'on' : '') + '">GattoSearch</button>' +
        '<button data-act="news-open" data-url="' + esc('https://news.google.com/search?hl=it&gl=IT&ceid=IT:it&q=' + encodeURIComponent(q)) + '">📰 Notizie</button>' +
        Object.keys(ENGINES).filter((k) => k !== 'gatto').map((k) => '<button data-act="search-on" data-engine="' + k + '" data-q="' + esc(q) + '">' + esc(ENGINES[k].label) + ' →</button>').join('') +
      '</div>' +
      '<div id="srBody"><div class="skeleton"></div><div class="skeleton" style="margin-top:10px"></div><div class="skeleton" style="margin-top:10px"></div></div>' +
    '</div>';

  const t0 = performance.now();
  const [wiki, ddg] = await Promise.allSettled([wikiSearch(q), ddgSearch(q)]);
  if (tab.pane !== pane) return;
  const wikiHits = wiki.status === 'fulfilled' ? wiki.value : [];
  const ddgHits = ddg.status === 'fulfilled' ? ddg.value : [];
  const ms = Math.round(performance.now() - t0);
  const body = $('#srBody', pane);
  if (!body) return;

  const abstract = ddgHits.find((h) => h.abstract);
  let html = '';
  if (abstract) {
    html += '<div class="answer"><h4>' + esc(abstract.title) + '</h4><p>' + esc(abstract.snippet) + '</p>' +
      (abstract.url ? '<a class="src" href="' + esc(abstract.url) + '" data-act="open-url" data-url="' + esc(abstract.url) + '">' + esc(prettyHost(abstract.url)) + ' ↗</a>' : '') + '</div>';
  }
  const seen = {};
  const hits = wikiHits.concat(ddgHits.filter((h) => !h.abstract));
  hits.forEach((hit) => {
    if (!hit.url || seen[hit.url]) return;
    seen[hit.url] = 1;
    html += '<a class="sr-hit" href="' + esc(hit.url) + '" data-act="open-url" data-url="' + esc(hit.url) + '">' +
      (hit.thumb ? '<img class="th" src="' + esc(hit.thumb) + '" alt="" loading="lazy">' : '') +
      '<span class="u">' + esc(hit.source) + ' · ' + esc(prettyHost(hit.url)) + '</span>' +
      '<div class="t">' + esc(hit.title) + '</div>' +
      '<div class="d">' + esc(hit.snippet || '') + '</div>' +
    '</a>';
  });
  if (!hits.length) {
    html += '<div class="empty-state"><div class="big">🐾</div>Nessun risultato nell\'indice libero per <b>' + esc(q) + '</b>.<br>Prova GattoSearch su un motore esterno qui sopra.</div>';
  }
  body.innerHTML = html;
  const stats = $('#srStats', pane);
  if (stats) stats.textContent = hits.length + ' risultati · ' + ms + ' ms · indice Wikipedia + DuckDuckGo';
  $('#memInfo').textContent = 'RAM ' + memEstimate();
}

function memEstimate() {
  const m = performance.memory;
  if (!m || !m.usedJSHeapSize) return 'n/d';
  return '~' + (m.usedJSHeapSize / 1048576).toFixed(1) + ' MB';
}
