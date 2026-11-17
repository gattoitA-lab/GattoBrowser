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
  google: { label: 'Google', tag: 'vieta l\'incorporamento', build: (q) => 'https://www.google.com/search?q=' + encodeURIComponent(q) },
  bing: { label: 'Bing', tag: 'dentro GattoBrowser', build: (q) => 'https://www.bing.com/search?q=' + encodeURIComponent(q) },
  duckduckgo: { label: 'DuckDuckGo', tag: 'vieta l\'incorporamento', build: (q) => 'https://duckduckgo.com/?q=' + encodeURIComponent(q) },
  wikipedia: { label: 'Wikipedia', tag: 'enciclopedia', build: (q) => 'https://it.wikipedia.org/w/index.php?search=' + encodeURIComponent(q) },
  youtube: { label: 'YouTube', tag: 'dentro GattoBrowser', build: (q) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q) },
  brave: { label: 'Brave', tag: 'esterno', build: (q) => 'https://search.brave.com/search?q=' + encodeURIComponent(q) },
  github: { label: 'GitHub', tag: 'codice', build: (q) => 'https://github.com/search?q=' + encodeURIComponent(q) }
};

/* Indice locale dei siti più cercati: risultati istantanei, senza rete */
const POPULAR_SITES = [
  { name: 'Duolingo', url: 'https://www.duolingo.com/', keys: ['duolingo', 'lingue', 'impara lingue', 'inglese'] },
  { name: 'Duolingo English Test', url: 'https://englishtest.duolingo.com/', keys: ['duolingo test', 'english test', 'certificazione inglese'] },
  { name: 'YouTube', url: 'https://www.youtube.com/', keys: ['youtube', 'video', 'musica'] },
  { name: 'Google', url: 'https://www.google.com/', keys: ['google'] },
  { name: 'Google News', url: 'https://news.google.com/', keys: ['google news', 'notizie'] },
  { name: 'Google Maps', url: 'https://maps.google.com/', keys: ['maps', 'mappe', 'indicazioni'] },
  { name: 'Gmail', url: 'https://mail.google.com/', keys: ['gmail', 'email', 'posta'] },
  { name: 'Google Drive', url: 'https://drive.google.com/', keys: ['drive', 'google drive'] },
  { name: 'GattoHub', url: 'https://gattoita-lab.github.io/GattoHub/', keys: ['gattohub', 'playhub', 'giochi'] },
  { name: 'Wikipedia', url: 'https://it.wikipedia.org/', keys: ['wikipedia', 'enciclopedia'] },
  { name: 'Amazon', url: 'https://www.amazon.it/', keys: ['amazon', 'shopping', 'acquisti'] },
  { name: 'Netflix', url: 'https://www.netflix.com/', keys: ['netflix', 'film', 'serie tv'] },
  { name: 'Prime Video', url: 'https://www.primevideo.com/', keys: ['prime video', 'amazon video'] },
  { name: 'Disney+', url: 'https://www.disneyplus.com/', keys: ['disney', 'disney plus'] },
  { name: 'Spotify', url: 'https://open.spotify.com/', keys: ['spotify', 'musica'] },
  { name: 'Twitch', url: 'https://www.twitch.tv/', keys: ['twitch', 'streaming'] },
  { name: 'TikTok', url: 'https://www.tiktok.com/', keys: ['tiktok', 'video brevi'] },
  { name: 'Instagram', url: 'https://www.instagram.com/', keys: ['instagram', 'foto'] },
  { name: 'Facebook', url: 'https://www.facebook.com/', keys: ['facebook', 'social'] },
  { name: 'WhatsApp', url: 'https://web.whatsapp.com/', keys: ['whatsapp', 'messaggi'] },
  { name: 'Telegram', url: 'https://web.telegram.org/', keys: ['telegram'] },
  { name: 'Discord', url: 'https://discord.com/app', keys: ['discord', 'chat vocale'] },
  { name: 'X (Twitter)', url: 'https://x.com/', keys: ['twitter', 'x', 'tweet'] },
  { name: 'Reddit', url: 'https://www.reddit.com/', keys: ['reddit', 'forum'] },
  { name: 'Pinterest', url: 'https://www.pinterest.com/', keys: ['pinterest', 'idee'] },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/', keys: ['linkedin', 'lavoro'] },
  { name: 'GitHub', url: 'https://github.com/', keys: ['github', 'codice', 'programmare'] },
  { name: 'ChatGPT', url: 'https://chatgpt.com/', keys: ['chatgpt', 'openai', 'ai'] },
  { name: 'Gemini', url: 'https://gemini.google.com/', keys: ['gemini', 'google ai'] },
  { name: 'Claude', url: 'https://claude.ai/', keys: ['claude', 'anthropic'] },
  { name: 'Canva', url: 'https://www.canva.com/', keys: ['canva', 'grafica'] },
  { name: 'Steam', url: 'https://store.steampowered.com/', keys: ['steam', 'giochi pc'] },
  { name: 'Roblox', url: 'https://www.roblox.com/', keys: ['roblox'] },
  { name: 'Minecraft', url: 'https://www.minecraft.net/', keys: ['minecraft'] },
  { name: 'Epic Games', url: 'https://store.epicgames.com/', keys: ['epic games', 'fortnite'] },
  { name: 'PlayStation Store', url: 'https://store.playstation.com/', keys: ['playstation', 'ps store'] },
  { name: 'Xbox', url: 'https://www.xbox.com/', keys: ['xbox'] },
  { name: 'Nintendo', url: 'https://www.nintendo.it/', keys: ['nintendo', 'switch'] },
  { name: 'eBay', url: 'https://www.ebay.it/', keys: ['ebay', 'aste'] },
  { name: 'Subito', url: 'https://www.subito.it/', keys: ['subito', 'annunci'] },
  { name: 'Vinted', url: 'https://www.vinted.it/', keys: ['vinted', 'vestiti usati'] },
  { name: 'AliExpress', url: 'https://it.aliexpress.com/', keys: ['aliexpress'] },
  { name: 'Temu', url: 'https://www.temu.com/', keys: ['temu'] },
  { name: 'Shein', url: 'https://it.shein.com/', keys: ['shein'] },
  { name: 'Booking.com', url: 'https://www.booking.com/', keys: ['booking', 'hotel'] },
  { name: 'Airbnb', url: 'https://www.airbnb.it/', keys: ['airbnb', 'affitto'] },
  { name: 'Trenitalia', url: 'https://www.trenitalia.com/', keys: ['trenitalia', 'treni'] },
  { name: 'Italo', url: 'https://www.italotreno.it/', keys: ['italo', 'treno veloce'] },
  { name: 'Poste Italiane', url: 'https://www.poste.it/', keys: ['poste', 'poste italiane'] },
  { name: 'INPS', url: 'https://www.inps.it/', keys: ['inps', 'pensioni'] },
  { name: 'Agenzia delle Entrate', url: 'https://www.agenziaentrate.gov.it/', keys: ['agenzia entrate', 'tasse'] },
  { name: 'PayPal', url: 'https://www.paypal.com/it/', keys: ['paypal', 'pagamenti'] },
  { name: 'Satispay', url: 'https://www.satispay.com/', keys: ['satispay'] },
  { name: 'UniCredit', url: 'https://www.unicredit.it/', keys: ['unicredit', 'banca'] },
  { name: 'Intesa Sanpaolo', url: 'https://www.intesasanpaolo.com/', keys: ['intesa', 'sanpaolo'] },
  { name: 'RaiPlay', url: 'https://www.raiplay.it/', keys: ['raiplay', 'rai', 'tv italiana'] },
  { name: 'Mediaset Infinity', url: 'https://mediasetinfinity.mediaset.it/', keys: ['mediaset', 'infinity', 'tv'] },
  { name: 'DAZN', url: 'https://www.dazn.com/', keys: ['dazn', 'calcio'] },
  { name: 'Sky', url: 'https://www.sky.it/', keys: ['sky', 'sky q'] },
  { name: 'La Gazzetta dello Sport', url: 'https://www.gazzetta.it/', keys: ['gazzetta', 'sport'] },
  { name: 'Corriere della Sera', url: 'https://www.corriere.it/', keys: ['corriere', 'notizie'] },
  { name: 'la Repubblica', url: 'https://www.repubblica.it/', keys: ['repubblica'] },
  { name: 'Il Post', url: 'https://www.ilpost.it/', keys: ['il post', 'post'] },
  { name: 'ANSA', url: 'https://www.ansa.it/', keys: ['ansa'] },
  { name: 'Zoom', url: 'https://zoom.us/', keys: ['zoom', 'videocall'] },
  { name: 'Outlook', url: 'https://outlook.live.com/', keys: ['outlook', 'hotmail', 'mail'] },
  { name: 'Microsoft', url: 'https://www.microsoft.com/', keys: ['microsoft', 'windows'] },
  { name: 'Apple', url: 'https://www.apple.com/', keys: ['apple', 'iphone'] },
  { name: 'iCloud', url: 'https://www.icloud.com/', keys: ['icloud'] },
  { name: 'Khan Academy', url: 'https://it.khanacademy.org/', keys: ['khan academy', 'matematica'] },
  { name: 'Quizlet', url: 'https://quizlet.com/', keys: ['quizlet', 'flashcard'] },
  { name: 'Coursera', url: 'https://www.coursera.org/', keys: ['coursera', 'corsi'] },
  { name: 'Udemy', url: 'https://www.udemy.com/', keys: ['udemy', 'corsi'] },
  { name: 'Bing', url: 'https://www.bing.com/', keys: ['bing'] },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/', keys: ['duckduckgo', 'ddg'] },
  { name: 'Brave Search', url: 'https://search.brave.com/', keys: ['brave'] },
  { name: 'Ecosia', url: 'https://www.ecosia.org/', keys: ['ecosia'] },
  { name: 'Yahoo', url: 'https://it.yahoo.com/', keys: ['yahoo'] },
  { name: 'Trenord', url: 'https://www.trenord.it/', keys: ['trenord', 'treni lombardia'] },
  { name: 'ATM Milano', url: 'https://www.atm.it/', keys: ['atm', 'metro milano'] },
  { name: 'Trenitalia Regionale', url: 'https://www.lefrecce.it/', keys: ['le frecce', 'biglietti treno'] },
  { name: 'Wattpad', url: 'https://www.wattpad.com/', keys: ['wattpad', 'storie'] },
  { name: 'Goodreads', url: 'https://www.goodreads.com/', keys: ['goodreads', 'libri'] },
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com/', keys: ['crunchyroll', 'anime'] },
  { name: 'HBO Max', url: 'https://www.hbomax.com/', keys: ['hbo', 'max'] },
  { name: 'Google Translate', url: 'https://translate.google.com/', keys: ['traduttore', 'tradurre', 'translate'] }
];

function normText(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function searchPopularSites(q) {
  const nq = normText(q);
  if (!nq) return [];
  const scored = [];
  POPULAR_SITES.forEach((site) => {
    const keys = [site.name].concat(site.keys || []).map(normText);
    let score = 0;
    keys.forEach((k) => {
      if (k === nq) score = Math.max(score, 100);
      else if (k.indexOf(nq) === 0) score = Math.max(score, 85);
      else if (nq.indexOf(k) === 0 && k.length >= 3) score = Math.max(score, 70);
      else if (k.length >= 4 && (k.indexOf(nq) >= 0 || nq.indexOf(k) >= 0)) score = Math.max(score, 45);
    });
    if (score) scored.push({ name: site.name, url: site.url, score: score });
  });
  const seen = {};
  return scored.sort((a, b) => b.score - a.score).filter((s) => {
    if (seen[s.url]) return false;
    seen[s.url] = 1;
    return true;
  }).slice(0, 4);
}

/* Se la ricerca è una parola sola, prova il dominio ufficiale (.com/.it/.org) */
async function probeDomain(q) {
  const clean = normText(q).replace(/ /g, '');
  if (!clean || clean.length < 3 || clean.length > 24) return null;
  const candidates = ['.com', '.it', '.org'].map((t) => 'https://' + clean + t);
  const results = await Promise.all(candidates.map((url) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2200);
    return fetch(url, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal })
      .then(() => { clearTimeout(timer); return url; })
      .catch(() => { clearTimeout(timer); return null; });
  }));
  return results.find(Boolean) || null;
}

const DEFAULT_HOME_LINKS = [
  { title: 'GattoHub', url: CONFIG.hub },
  { title: 'PlayHub', url: CONFIG.hub },
  { title: 'Google News', url: CONFIG.news },
  { title: 'Wikipedia', url: 'https://it.wikipedia.org/' },
  { title: 'YouTube', url: 'https://www.youtube.com/' }
];

const DEFAULT_SETTINGS = {
  profileName: 'GattoHub', profileEmail: '',
  theme: 'dark', accent: '#00ff66', fontSize: 14, animations: true,
  highContrast: false, largeCaret: false, reducedMotion: false,
  searchEngine: 'gatto', suggestions: true, resultsNewTab: false,
  guard: true, guardLevel: 'medio', blockPopups: true, clearOnExit: false, doNotTrack: true,
  memorySaver: true, memorySaverMinutes: 5, savingsMode: false, prefetch: true, autoExternal: false,
  autofill: true, saveForms: true, savedIdentities: [],
  aiEnabled: true, autoCopyShot: true, aiTarget: CONFIG.chat, aiModel: 'meow-smart',
  startup: 'home', startupLinks: [],
  language: 'it', translateTarget: 'it', translateSites: false,
  askDownloadLocation: false, openPdfExternal: true,
  showBookmarksBar: true, zoom: 100,
  bookmarks: [{ title: 'GattoHub', url: CONFIG.hub }],
  homeLinks: DEFAULT_HOME_LINKS.slice(),
  homeBg: { type: 'gradient', value: '' },
  settingsVersion: 2,
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
    const saved = JSON.parse(raw) || {};
    const s = deepMerge(cloneSettings(DEFAULT_SETTINGS), saved);
    const previousVersion = Number(saved.settingsVersion || 0);
    /* migrazione: rimuove il profilo di esempio con dati personali non richiesti */
    if (s.profileEmail === 'francypanda2014@gmail.com' || s.profileName === 'Francy') {
      s.profileName = DEFAULT_SETTINGS.profileName;
      s.profileEmail = DEFAULT_SETTINGS.profileEmail;
      try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) { /* noop */ }
    }
    /* una volta sola: niente finestre automatiche per i siti non incorporabili */
    if (!saved.autoWindowMigrated) {
      s.autoExternal = false;
      s.autoWindowMigrated = true;
      s.settingsVersion = 2;
      try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) { /* noop */ }
    }
    return s;
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

/* YouTube home e risultati: non incorporabili, ma ricostruiti dentro GattoBrowser con l'API di Piped */
const PIPED_API = 'https://api.piped.private.coffee';
function youTubeBrowseKind(url) {
  try {
    const u = new URL(url);
    if (!/(^|\.)youtube\.com$/i.test(u.hostname)) return null;
    if (u.pathname === '/' || u.pathname === '') return 'home';
    if (/^\/feed\/(trending|explore)$/i.test(u.pathname)) return 'home';
    if (u.pathname === '/results') return 'search';
    return null;
  } catch (e) { return null; }
}

function fmtDuration(sec) {
  const n = Math.max(0, Number(sec) || 0);
  const h = Math.floor(n / 3600), m = Math.floor((n % 3600) / 60), s = n % 60;
  const pad = (x) => String(x).padStart(2, '0');
  return h ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
}
function fmtViews(v) {
  const n = Number(v) || 0;
  if (n >= 1000000000) return (n / 1000000000).toFixed(1).replace('.', ',') + ' mld di visualizzazioni';
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.', ',') + ' mln di visualizzazioni';
  if (n >= 1000) return Math.round(n / 1000) + ' mila visualizzazioni';
  return n + ' visualizzazioni';
}

/* Domini verificati che inviano X-Frame-Options / frame-ancestors: si aprono in finestra */
const EXTERNAL_HOSTS = [
  'duolingo.com', 'netflix.com', 'instagram.com', 'tiktok.com', 'spotify.com', 'github.com',
  'subito.it', 'booking.com', 'airbnb.it', 'airbnb.com', 'ansa.it', 'canva.com', 'chatgpt.com',
  'openai.com', 'gemini.google.com', 'roblox.com', 'epicgames.com', 'satispay.com', 'quizlet.com',
  'coursera.org', 'mediasetinfinity.mediaset.it', 'mediaset.it', 'disneyplus.com', 'primevideo.com',
  'dazn.com', 'twitch.tv', 'linkedin.com', 'pinterest.com', 'reddit.com', 'discord.com',
  'whatsapp.com', 'web.telegram.org', 'x.com', 'twitter.com', 'facebook.com', 'netflix.net',
  'englishtest.duolingo.com', 'hbonmax.com', 'hbomax.com', 'crunchyroll.com', 'wattpad.com'
];

function isExternalOnly(url) {
  if (youtubeId(url)) return false; // il player è incorporabile
  if (youTubeBrowseKind(url)) return false; // home e ricerca: pagina interna
  if (EMBED_BLOCKERS.some((rx) => rx.test(url))) return true;
  const host = hostOf(url);
  if (!host) return false;
  return EXTERNAL_HOSTS.some((d) => host === d || host.endsWith('.' + d));
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

  /* YouTube home e risultati: esperienza interna con player GattoBrowser */
  if (youTubeBrowseKind(tab.url)) {
    buildYouTubeApp(tab);
    return;
  }

  /* Siti che vietano l'incorporamento: tutto dentro la scheda, con scelta esplicita */
  if (!tab.forceEmbed && isExternalOnly(tab.url)) {
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

  const floatBtn = document.createElement('button');
  floatBtn.className = 'openfloat';
  floatBtn.type = 'button';
  floatBtn.title = 'Apri questo sito in una finestra dedicata';
  floatBtn.textContent = '↗';
  floatBtn.onclick = () => openDedicatedWindow(tab.url);
  host.appendChild(floatBtn);

  pane.appendChild(host);
  tab.frame = frame;
  tab.suspended = false;
  if (typeof renderCredentialBar === 'function') renderCredentialBar(tab);

  let frameLoaded = false;
  frame.addEventListener('load', () => {
    frameLoaded = true;
    $('#statusMsg').textContent = 'Caricato: ' + prettyHost(tab.url);
  });
  setTimeout(() => {
    if (frameLoaded || tab.pane !== pane || tab.suspended) return;
    if (host.querySelector('.load-warn')) return;
    const warn = document.createElement('div');
    warn.className = 'embed-note load-warn';
    warn.innerHTML = '<b>Non si carica?</b> Questo sito probabilmente vieta l\'incorporamento.' +
      '<button data-act="open-external" data-url="' + esc(tab.url) + '">Apri in finestra ↗</button>';
    host.insertBefore(warn, host.firstChild);
  }, 4200);
}

/* YouTube dentro GattoBrowser: elenco video dall'API Piped, riproduzione col player nativo */
function buildYouTubeApp(tab) {
  const pane = tab.pane;
  const kind = youTubeBrowseKind(tab.url);
  let q = '';
  try { q = new URL(tab.url).searchParams.get('search_query') || ''; } catch (e) { q = ''; }

  pane.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'yt-app';
  wrap.innerHTML =
    '<div class="yt-top">' +
      '<b class="yt-brand">▶ YouTube</b>' +
      '<form class="yt-form"><input id="ytQ" type="search" placeholder="Cerca video su YouTube" value="' + esc(q) + '"><button class="btn primary" type="submit">Cerca</button></form>' +
      '<span class="tag">dentro GattoBrowser</span>' +
    '</div>' +
    '<div class="yt-grid" id="ytGrid"><div class="yt-msg">Carico i video…</div></div>';
  pane.appendChild(wrap);

  const grid = wrap.querySelector('#ytGrid');
  wrap.querySelector('.yt-form').onsubmit = (e) => {
    e.preventDefault();
    const v = wrap.querySelector('#ytQ').value.trim();
    if (v) navigate(tab, 'https://www.youtube.com/results?search_query=' + encodeURIComponent(v), { replace: true });
  };
  tab.suspended = false;

  const api = (S.pipedApi || PIPED_API);
  const endpoint = kind === 'search'
    ? api + '/search?q=' + encodeURIComponent(q) + '&filter=videos'
    : api + '/trending?region=IT';

  fetch(endpoint).then((r) => (r.ok ? r.json() : Promise.reject(new Error('http ' + r.status))))
    .then((data) => {
      const items = (Array.isArray(data) ? data : (data && data.items) || []).filter((i) => i && i.url && /v=[\w-]{6,}/.test(i.url));
      if (!items.length) throw new Error('nessun video');
      grid.innerHTML = '';
      items.slice(0, 24).forEach((it) => {
        const id = (String(it.url).match(/v=([\w-]{6,})/) || [])[1];
        if (!id) return;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'yt-card';
        card.innerHTML =
          '<div class="yt-thumb"><img loading="lazy" alt="" src="' + esc(it.thumbnail || ('https://i.ytimg.com/vi/' + id + '/hqdefault.jpg')) + '">' +
          (it.duration ? '<span class="yt-dur">' + esc(fmtDuration(it.duration)) + '</span>' : '') + '</div>' +
          '<b>' + esc(it.title || 'Video') + '</b>' +
          '<small>' + esc(it.uploaderName || '') + (it.views ? ' · ' + esc(fmtViews(it.views)) : '') + '</small>';
        card.onclick = () => openUrl('https://www.youtube.com/watch?v=' + id, { newTab: true });
        grid.appendChild(card);
      });
      $('#statusMsg').textContent = 'YouTube dentro GattoBrowser · ' + items.length + ' video';
    })
    .catch(() => {
      grid.innerHTML =
        '<div class="yt-msg"><b>Non riesco a caricare i video adesso</b><br>' +
        'Il servizio che legge YouTube non risponde: puoi cercare su Bing oppure aprire YouTube in una finestra.<br>' +
        '<button class="btn" data-act="open-external" data-url="' + esc(tab.url) + '">Apri YouTube in finestra ↗</button> ' +
        '<button class="btn" data-act="open-settings" data-sec="search">Cambia servizio</button></div>';
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
  const googleQuery = (() => {
    try {
      const u = new URL(url);
      return /(^|\.)google\./i.test(u.hostname) && /^\/search/.test(u.pathname) ? (u.searchParams.get('q') || '') : '';
    } catch (e) { return ''; }
  })();
  const wrap = document.createElement('div');
  wrap.className = 'blocked';
  wrap.innerHTML =
    '<div class="card">' +
      '<div class="shield">🔒</div>' +
      '<h2>Questo sito vieta di essere aperto dentro un\'altra pagina</h2>' +
      '<p><b>' + esc(prettyHost(url)) + '</b> invia l\'header <b>X-Frame-Options</b>: per sicurezza impedisce a qualunque browser di mostrarlo dentro un\'altra pagina. Non è un limite di GattoBrowser, è una scelta del sito.</p>' +
      '<div class="url">' + esc(url) + '</div>' +
      '<div class="acts">' +
        (googleQuery ? '<button class="btn primary" data-bing>Cerca con Bing qui</button>' : '') +
        '<button class="btn" data-force>Prova a mostrarlo qui</button>' +
        '<button class="btn' + (googleQuery ? '' : ' primary') + '" data-open-here>Apri in una finestra dedicata ↗</button>' +
        '<button class="btn" data-act="copy-link" data-url="' + esc(url) + '">Copia link</button>' +
      '</div>' +
      '<div style="font-size:11.5px;color:var(--muted);max-width:100%">Nessuna finestra si apre da sola: premi tu il pulsante quando vuoi. Puoi attivare l\'apertura automatica in Impostazioni → Privacy.</div>' +
    '</div>';
  pane.appendChild(wrap);
  wrap.querySelector('[data-open-here]').onclick = () => openDedicatedWindow(url);
  wrap.querySelector('[data-force]').onclick = () => { tab.forceEmbed = true; refreshTab(tab); };
  const bingBtn = wrap.querySelector('[data-bing]');
  if (bingBtn) bingBtn.onclick = () => navigate(tab, 'https://www.bing.com/search?q=' + encodeURIComponent(googleQuery), { replace: true });
  if (S.autoExternal && (typeof hasGesture !== 'function' || hasGesture())) openDedicatedWindow(url);
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
  const siteHits = searchPopularSites(q);
  const engineKeys = ['google', 'bing', 'duckduckgo', 'brave'];

  pane.innerHTML =
    '<div class="sr">' +
      '<div class="sr-top"><span class="glogo">🐱 GattoSearch</span><span class="stats" id="srStats">ricerca…</span></div>' +
      '<h2 class="sr-q">' + esc(q) + '</h2>' +
      '<div class="sr-enginebar">' +
        '<span class="sr-hint">Risultati web:</span>' +
        engineKeys.map((k) => '<button class="engine-btn" data-act="engine-search" data-engine="' + k + '" data-q="' + esc(q) + '">' + esc(ENGINES[k].label) + ' ↗</button>').join('') +
        '<button class="engine-btn" data-act="news-open" data-url="' + esc('https://news.google.com/search?hl=it&gl=IT&ceid=IT:it&q=' + encodeURIComponent(q)) + '">📰 Notizie</button>' +
      '</div>' +
      '<div id="srInstant"></div>' +
      '<div id="srAnswer"></div>' +
      '<div id="srWeb"><div class="skeleton"></div><div class="skeleton" style="margin-top:10px"></div><div class="skeleton" style="margin-top:10px"></div></div>' +
      '<div id="srMore"></div>' +
      '<div class="set-note" style="max-width:100%">GattoSearch mostra <b>siti ufficiali</b>, <b>Wikipedia</b> e <b>risposte istantanee</b>: sono le fonti che un sito web può leggere direttamente. Per tutti i risultati di <b>Google</b>, <b>Bing</b>, <b>DuckDuckGo</b> o <b>Brave</b> usa i pulsanti qui sopra: si aprono in una finestra dedicata con i risultati veri del motore, in un clic.</div>' +
    '</div>';

  renderInstantSites(pane, q, siteHits);

  if (!/\s/.test(String(q).trim()) && !siteHits.length) {
    probeDomain(q).then((guess) => {
      if (!guess || tab.pane !== pane) return;
      const box = $('#srInstant', pane);
      if (!box || box.dataset.guess) return;
      box.dataset.guess = '1';
      box.innerHTML = '<div class="sec-head" style="margin:2px 0 8px"><h3>Sito ufficiale</h3><span class="hint">dominio trovato</span></div>' +
        '<div class="instant-grid"><a class="instant-card" href="' + esc(guess) + '" data-act="open-url" data-url="' + esc(guess) + '">' +
        '<span class="fav-ic">' + esc(favLetter(prettyHost(guess))) + '</span>' +
        '<span class="ic-txt"><b>' + esc(prettyHost(guess)) + '</b><small>sito ufficiale</small></span>' +
        '<span class="ic-go">Vai →</span></a></div>' + box.innerHTML;
    });
  }

  const t0 = performance.now();
  const [wiki, ddg] = await Promise.allSettled([wikiSearch(q), ddgSearch(q)]);
  if (tab.pane !== pane) return;
  const wikiHits = wiki.status === 'fulfilled' ? wiki.value : [];
  const ddgHits = ddg.status === 'fulfilled' ? ddg.value : [];
  const ms = Math.round(performance.now() - t0);

  const answerBox = $('#srAnswer', pane);
  const webBox = $('#srWeb', pane);
  const moreBox = $('#srMore', pane);
  if (!webBox) return;

  const abstract = ddgHits.find((h) => h.abstract);
  if (answerBox) {
    answerBox.innerHTML = abstract
      ? '<div class="answer"><h4>' + esc(abstract.title) + '</h4><p>' + esc(abstract.snippet) + '</p>' +
        (abstract.url ? '<a class="src" href="' + esc(abstract.url) + '" data-act="open-url" data-url="' + esc(abstract.url) + '">' + esc(prettyHost(abstract.url)) + ' ↗</a>' : '') + '</div>'
      : '';
  }

  const seen = {};
  const hits = [];
  wikiHits.forEach((h) => { if (h.url && !seen[h.url]) { seen[h.url] = 1; hits.push(h); } });
  ddgHits.filter((h) => !h.abstract).forEach((h) => { if (h.url && !seen[h.url]) { seen[h.url] = 1; hits.push(h); } });

  webBox.innerHTML = hits.map((hit) =>
    '<a class="sr-hit" href="' + esc(hit.url) + '" data-act="open-url" data-url="' + esc(hit.url) + '">' +
      (hit.thumb ? '<img class="th" src="' + esc(hit.thumb) + '" alt="" loading="lazy">' : '') +
      '<span class="u">' + esc(hit.source) + ' · ' + esc(prettyHost(hit.url)) + '</span>' +
      '<div class="t">' + esc(hit.title) + '</div>' +
      '<div class="d">' + esc(hit.snippet || '') + '</div>' +
    '</a>').join('');

  if (moreBox) {
    moreBox.innerHTML =
      '<div class="sr-more">' +
        ['google', 'bing', 'duckduckgo'].map((k) => '<button class="engine-mini" data-act="engine-search" data-engine="' + k + '" data-q="' + esc(q) + '">Cerca “' + esc(q) + '” su ' + esc(ENGINES[k].label) + ' ↗</button>').join('') +
      '</div>';
  }

  const total = siteHits.length + hits.length + (abstract ? 1 : 0);
  const stats = $('#srStats', pane);
  if (stats) stats.textContent = total + ' risultati · ' + ms + ' ms · siti ufficiali + Wikipedia + DuckDuckGo';
  $('#memInfo').textContent = 'RAM ' + memEstimate();
  $('#statusMsg').textContent = 'GattoSearch: ' + total + ' risultati in ' + ms + ' ms';
}

function renderInstantSites(pane, q, siteHits) {
  const box = $('#srInstant', pane);
  if (!box) return;
  if (!siteHits.length) { box.innerHTML = ''; return; }
  box.innerHTML = '<div class="sec-head" style="margin:2px 0 8px"><h3>Siti ufficiali</h3><span class="hint">istantaneo</span></div>' +
    '<div class="instant-grid">' + siteHits.map((s) =>
      '<a class="instant-card" href="' + esc(s.url) + '" data-act="open-url" data-url="' + esc(s.url) + '">' +
        '<span class="fav-ic">' + esc(favLetter(s.name)) + '</span>' +
        '<span class="ic-txt"><b>' + esc(s.name) + '</b><small>' + esc(prettyHost(s.url)) + '</small></span>' +
        '<span class="ic-go">Apri →</span>' +
      '</a>').join('') + '</div>';
}

function memEstimate() {
  const m = performance.memory;
  if (!m || !m.usedJSHeapSize) return 'n/d';
  return '~' + (m.usedJSHeapSize / 1048576).toFixed(1) + ' MB';
}
