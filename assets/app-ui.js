'use strict';
/* GattoBrowser — interfaccia: pagine interne, omnibox, menu a 3 puntini, GattoGuard, eventi */

/* ---------------------------- pagine interne ---------------------------- */
function buildHistory(tab) {
  const pane = tab.pane;
  pane.innerHTML =
    '<div class="page">' +
      '<h2>🕘 Cronologia</h2>' +
      '<p class="lead">' + S.history.length + ' pagine visitate su questo dispositivo.</p>' +
      '<div class="row"><input class="mini" id="histFilter" placeholder="Filtra la cronologia…" style="flex:1;min-width:180px;height:36px">' +
      '<button class="btn" data-act="open-settings" data-sec="privacy">Elimina dati…</button>' +
      '<button class="btn danger" data-act="clear-history">Cancella cronologia</button></div>' +
      '<div class="list" id="histList"></div>' +
    '</div>';
  const render = (filter) => {
    const f = String(filter || '').toLowerCase();
    const items = S.history.filter((h) => !f || (h.title + ' ' + h.url).toLowerCase().includes(f)).slice(0, 200);
    const box = $('#histList', pane);
    box.innerHTML = items.length ? items.map((h) =>
      '<div class="list-item"><span class="ico">' + esc(favLetter(h.title)) + '</span>' +
        '<button class="main" data-act="open-url" data-url="' + esc(h.url) + '" style="text-align:left;background:none"><b>' + esc(h.title) + '</b><small>' + esc(h.url) + ' · ' + esc(fmtTime(h.date)) + '</small></button>' +
        '<button class="x" data-act="del-history" data-date="' + h.date + '" title="Rimuovi">✕</button></div>'
    ).join('') : '<div class="empty-state"><div class="big">🐾</div>Nessuna pagina nella cronologia.</div>';
  };
  render('');
  const f = $('#histFilter', pane);
  if (f) f.addEventListener('input', () => render(f.value));
}

function buildDownloads(tab) {
  const pane = tab.pane;
  pane.innerHTML =
    '<div class="page">' +
      '<h2>⬇ Download</h2>' +
      '<p class="lead">Download e screenshot salvati con GattoBrowser (elenco locale).</p>' +
      '<div class="row"><button class="btn primary" data-act="run" data-run="shot">📷 Nuovo screenshot</button>' +
      '<button class="btn danger" data-act="clear-downloads">Svuota elenco</button></div>' +
      '<div class="list">' +
        (S.downloads.length ? S.downloads.map((d) =>
          '<div class="list-item"><span class="ico">' + (d.kind === 'screenshot' ? '📷' : '⬇') + '</span>' +
            '<div class="main"><b>' + esc(d.name) + '</b><small>' + esc(d.kind) + ' · ' + bytes(d.size) + ' · ' + esc(fmtTime(d.date)) + (d.url ? ' · ' + esc(prettyHost(d.url)) : '') + '</small></div></div>'
        ).join('') : '<div class="empty-state"><div class="big">📂</div>Ancora nessun download.</div>') +
      '</div>' +
      '<div class="set-note">Con “Chiedi dove salvare” attivo, GattoBrowser usa il selettore file del sistema per scegliere la cartella.</div>' +
    '</div>';
}

function buildBookmarks(tab) {
  const pane = tab.pane;
  pane.innerHTML =
    '<div class="page">' +
      '<h2>☆ Preferiti ed elenchi</h2>' +
      '<p class="lead">' + S.bookmarks.length + ' preferiti salvati sul dispositivo.</p>' +
      '<div class="row"><button class="btn primary" data-act="star">☆ Aggiungi pagina corrente</button>' +
      '<button class="btn" data-act="run" data-run="list-add">＋ Nuovo elenco di lettura</button></div>' +
      '<div class="list">' +
        (S.bookmarks.length ? S.bookmarks.map((b, i) =>
          '<div class="list-item"><span class="ico">' + esc(favLetter(b.title)) + '</span>' +
            '<button class="main" data-act="open-url" data-url="' + esc(b.url) + '" style="text-align:left;background:none"><b>' + esc(b.title) + '</b><small>' + esc(b.url) + '</small></button>' +
            '<button class="x" data-act="del-bookmark" data-i="' + i + '" title="Rimuovi">✕</button></div>'
        ).join('') : '<div class="empty-state"><div class="big">☆</div>Nessun preferito.</div>') +
      '</div>' +
      '<h3 style="font-size:13px;margin:8px 0 0">Elenchi di lettura</h3>' +
      '<div class="list">' +
        (S.lists.length ? S.lists.map((l, i) =>
          '<div class="list-item"><span class="ico">📚</span><div class="main"><b>' + esc(l.title) + '</b><small>' + l.items.length + ' elementi</small></div>' +
            '<button class="x" data-act="del-list" data-i="' + i + '">✕</button></div>'
        ).join('') : '<div class="empty-state">Nessun elenco. Creane uno per raccogliere link da leggere dopo.</div>') +
      '</div>' +
    '</div>';
}

/* ------------------------------- omnibox -------------------------------- */
function showSuggest(input) {
  if (!S.suggestions) { hideSuggest(); return; }
  const q = String(input.value || '').trim();
  const box = $('#suggest');
  const rows = [];
  if (q) {
    if (isUrlLike(q)) rows.push({ act: 'open-url', url: normalizeUrl(q), ico: '🌐', txt: normalizeUrl(q), tag: 'apri' });
    rows.push({ act: 'do-search', q, ico: '🐱', txt: 'Cerca “' + q + '” con GattoSearch', tag: 'GattoSearch' });
    Object.keys(ENGINES).filter((k) => k !== 'gatto').slice(0, 3).forEach((k) => {
      rows.push({ act: 'search-on', engine: k, q, ico: '↗', txt: q, tag: ENGINES[k].label });
    });
  }
  const matches = S.history.filter((h) => (h.url + ' ' + h.title).toLowerCase().includes(q.toLowerCase())).slice(0, q ? 4 : 5);
  matches.forEach((m) => rows.push({ act: 'open-url', url: m.url, ico: '🕘', txt: m.title, tag: prettyHost(m.url) }));
  if (!q) {
    S.bookmarks.slice(0, 3).forEach((b) => rows.push({ act: 'open-url', url: b.url, ico: '☆', txt: b.title, tag: prettyHost(b.url) }));
  }
  if (!rows.length) { hideSuggest(); return; }
  box.innerHTML = rows.map((r, i) =>
    '<div class="sg" data-act="' + r.act + '"' +
      (r.url ? ' data-url="' + esc(r.url) + '"' : '') +
      (r.q ? ' data-q="' + esc(r.q) + '"' : '') +
      (r.engine ? ' data-engine="' + r.engine + '"' : '') +
      ' data-idx="' + i + '"><span class="ico">' + r.ico + '</span><span class="txt">' + esc(r.txt) + '</span><span class="tag">' + esc(r.tag) + '</span></div>'
  ).join('');
  const rect = $('#omniWrap').getBoundingClientRect();
  box.style.top = (rect.bottom + 6) + 'px';
  box.style.left = Math.max(8, rect.left) + 'px';
  box.style.width = Math.min(rect.width, window.innerWidth - 16) + 'px';
  box.classList.remove('hidden');
}
function hideSuggest() { $('#suggest').classList.add('hidden'); }

/* -------------------------------- menu --------------------------------- */
function buildMenu() {
  const onBm = !!(activeTab() && activeTab().url && S.bookmarks.some((b) => b.url === activeTab().url));
  $('#menu').innerHTML =
    '<div class="dd-profile" data-act="open-settings" data-sec="account">' +
      '<div class="av">' + esc(favLetter(S.profileName)) + '</div>' +
      '<div class="nm"><b>' + esc(S.profileName) + '</b><small>' + esc(S.profileEmail) + '</small></div>' +
      '<span class="pill">Accesso effettuato</span>' +
    '</div>' +
    '<button class="dd-item" data-act="open-settings" data-sec="autofill"><span class="ico">🔑</span><span class="t">Password e compilazione automatica</span><span class="arrow">›</span></button>' +
    '<button class="dd-item" data-act="open-page" data-page="history"><span class="ico">🕘</span><span class="t">Cronologia</span><span class="k">Ctrl+H</span></button>' +
    '<button class="dd-item" data-act="open-page" data-page="downloads"><span class="ico">⬇</span><span class="t">Download</span><span class="k">Ctrl+J</span></button>' +
    '<button class="dd-item" data-act="open-page" data-page="bookmarks"><span class="ico">☆</span><span class="t">Preferiti ed elenchi</span><span class="arrow">›</span></button>' +
    '<button class="dd-item" data-act="run" data-run="groups"><span class="ico">🗂</span><span class="t">Gruppi di schede</span><span class="arrow">›</span></button>' +
    '<button class="dd-item" data-act="run" data-run="extensions"><span class="ico">🧩</span><span class="t">Estensioni</span><span class="arrow">›</span></button>' +
    '<button class="dd-item" data-act="run" data-run="clear"><span class="ico">🗑</span><span class="t">Elimina dati di navigazione</span><span class="k">Ctrl+⇧+Canc</span></button>' +
    '<div class="dd-sep"></div>' +
    '<div class="dd-label">Strumenti e azioni</div>' +
    '<div class="dd-zoom"><span class="ico" style="color:var(--muted)">🔍</span><span class="t" style="flex:1;font-size:13px">Carattere</span>' +
      '<button class="zbtn" data-act="zoom-out" title="Riduci">−</button><span class="zval">' + S.zoom + '%</span>' +
      '<button class="zbtn" data-act="zoom-in" title="Ingrandisci">＋</button>' +
      '<button class="zbtn full" data-act="fullscreen" title="Schermo intero">⛶</button></div>' +
    '<button class="dd-item" data-act="print"><span class="ico">🖨</span><span class="t">Stampa</span><span class="k">Ctrl+P</span></button>' +
    '<button class="dd-item" data-act="lens"><span class="ico">🔎</span><span class="t">Cerca in questa scheda con Google Lens</span></button>' +
    '<button class="dd-item" data-act="translate"><span class="ico">🌐</span><span class="t">Traduci</span></button>' +
    '<button class="dd-item" data-act="find"><span class="ico">🔤</span><span class="t">Trova e modifica</span><span class="k">Ctrl+F</span></button>' +
    '<button class="dd-item" data-act="share"><span class="ico">📤</span><span class="t">Trasmetti, salva e condividi</span><span class="arrow">›</span></button>' +
    '<button class="dd-item" data-act="more-tools"><span class="ico">🧰</span><span class="t">Altri strumenti</span><span class="arrow">›</span></button>' +
    '<div class="dd-sep"></div>' +
    '<button class="dd-item" data-act="star"><span class="ico">' + (onBm ? '★' : '☆') + '</span><span class="t">' + (onBm ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti') + '</span></button>' +
    '<button class="dd-item" data-act="shot"><span class="ico">📷</span><span class="t">Screenshot → AI</span></button>' +
    '<button class="dd-item" data-act="open-settings" data-sec="system"><span class="ico">⚙</span><span class="t">Impostazioni</span></button>';
}
function toggleMenu(force) {
  const menu = $('#menu');
  const willOpen = force === true || menu.classList.contains('hidden');
  if (!willOpen) { menu.classList.add('hidden'); return; }
  buildMenu();
  const r = $('#menuBtn').getBoundingClientRect();
  const width = Math.min(330, window.innerWidth - 16);
  menu.style.left = Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8)) + 'px';
  menu.style.top = (r.bottom + 6) + 'px';
  menu.style.width = width + 'px';
  menu.classList.remove('hidden');
}
function hideMenu() { $('#menu').classList.add('hidden'); }

/* ------------------------------ GattoGuard ----------------------------- */
const BAD_TLDS = ['.zip', '.mov', '.tk', '.ml', '.ga', '.cf', '.gq', '.top', '.click', '.rest', '.cam'];
const BAD_WORDS = ['free-gift', 'crack', 'keygen', 'phishing', 'malware', 'scarica-gratis', 'vincita', 'bitcoin-generator', 'hack-free', 'trojan'];

function guardCheck(url) {
  if (!S.guard || !S.extensions.guard) return { ok: true, score: 0, reasons: [] };
  let score = 0;
  const reasons = [];
  let u;
  try { u = new URL(url); } catch (e) { return { ok: true, score: 0, reasons: [] }; }
  if (u.protocol === 'http:') { score += 2; reasons.push('Connessione non cifrata (HTTP): i dati viaggiano in chiaro.'); }
  if (BAD_TLDS.some((t) => u.hostname.endsWith(t))) { score += 2; reasons.push('Dominio di alto rischio (' + u.hostname + ').'); }
  const low = url.toLowerCase();
  if (BAD_WORDS.some((w) => low.includes(w))) { score += 4; reasons.push('Parole tipiche di truffe o download infetti.'); }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)) { score += 2; reasons.push('Indirizzo IP al posto del nome del sito.'); }
  if (u.hostname.startsWith('xn--')) { score += 2; reasons.push('Dominio punycode: possibile imitazione di un sito noto.'); }
  if (url.length > 250) { score += 1; reasons.push('URL insolitamente lungo.'); }
  if ((u.hostname.match(/-/g) || []).length >= 4) { score += 1; reasons.push('Molti trattini nel dominio.'); }
  const limit = S.guardLevel === 'alto' ? 3 : S.guardLevel === 'basso' ? 6 : 4;
  return { ok: score < limit, score: Math.min(10, score), reasons };
}

/* -------------------------------- zoom --------------------------------- */
function setZoom(z, persist) {
  let v = Math.round(Number(z) || 100);
  v = Math.max(50, Math.min(200, v));
  S.zoom = v;
  const view = $('#view');
  if (view) view.style.zoom = (v / 100);
  const zi = $('#zoomInfo');
  if (zi) zi.textContent = v + '%';
  if (persist !== false) save();
}

/* ------------------------------ session -------------------------------- */
let sessionTimer = null;
function saveSession() {
  clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    try {
      const tabs = state.tabs.filter((t) => t.kind !== 'settings').slice(0, 10).map((t) => ({ kind: t.kind, url: t.url, query: t.query, title: t.title }));
      const activeIdx = state.tabs.findIndex((t) => t.id === state.active);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ tabs, active: activeIdx }));
    } catch (e) { /* noop */ }
  }, 400);
}

/* ------------------------------- actions ------------------------------- */
const ACTIONS = {
  newtab() { createTab('home'); },
  closetab(el) { closeTab(el.dataset.id); },
  activetab(el) { activateTab(el.dataset.id); },
  back, fwd: forward, reload,
  'nav-home'() { $('#omni').value = ''; createTab('home'); },
  menu() { toggleMenu(); },
  star() { toggleBookmark(); },
  shot() { takeScreenshot(); },
  'guard-info'() { guardInfoModal(); },
  'guard-back'() { createTab('home'); },
  'guard-bypass'() {
    const tab = activeTab();
    if (!tab || !tab.url) return;
    navigate(tab, tab.url, { bypass: true, replace: true });
    toast('GattoGuard aggirato per questa pagina', 'err');
  },
  'open-url'(el) { openUrl(el.dataset.url, { newTab: !!el.dataset.newtab }); },
  'open-external'(el) { window.open(el.dataset.url, '_blank', 'noopener,noreferrer'); },
  'open-page'(el) {
    const page = el.dataset.page;
    const found = state.tabs.find((t) => t.kind === page);
    if (found) activateTab(found.id); else createTab(page);
    hideMenu();
  },
  'open-settings'(el) {
    const sec = el.dataset.sec;
    const st = state.tabs.find((t) => t.kind === 'settings');
    if (st) { activateTab(st.id); refreshTab(st); }
    else createTab('settings');
    if (sec) setTimeout(() => setSettingsSection(sec), 30);
    hideMenu();
    hideSuggest();
  },
  'set-section'(el) { setSettingsSection(el.dataset.sec); },
  'pick-engine'(el) {
    S.searchEngine = el.dataset.engine === 'home' ? 'gatto' : el.dataset.engine;
    save();
    toast('Motore di ricerca: ' + (ENGINES[S.searchEngine] ? ENGINES[S.searchEngine].label : S.searchEngine));
    const tab = activeTab();
    if (tab && (tab.kind === 'home' || tab.kind === 'search')) refreshTab(tab);
    const st = state.tabs.find((t) => t.kind === 'settings');
    if (st) refreshTab(st);
  },
  'do-search'(el) { doSearch(el.dataset.q); hideSuggest(); },
  'search-on'(el) {
    const engine = ENGINES[el.dataset.engine];
    if (!engine) return;
    const url = engine.build(el.dataset.q);
    hideSuggest();
    if (S.resultsNewTab) openUrl(url, { newTab: true }); else openUrl(url);
  },
  'add-home-link'() { homeLinkModal(); },
  'del-home-link'(el) {
    const i = Number(el.dataset.i);
    S.homeLinks.splice(i, 1); save();
    const tab = activeTab(); if (tab && tab.kind === 'home') refreshTab(tab);
  },
  'loginLinks'() { homeLinksManager(); },
  'bg-edit'() { bgEditModal(); },
  'news-tab'() {
    const found = state.tabs.find((t) => t.kind === 'news');
    if (found) activateTab(found.id); else createTab('news');
  },
  'news-open'(el) {
    const url = el.dataset.url;
    openUrl(url, { newTab: true });
    setTimeout(() => {
      const t = activeTab();
      if (t && EMBED_BLOCKERS.some((rx) => rx.test(t.url))) toast('Google News blocca l\'incorporamento: usa “Apri in finestra ↗”', '', 5000);
    }, 400);
  },
  playhub() { playhubEnter(); },
  'zoom-in'() { setZoom(S.zoom + 10); buildMenu(); },
  'zoom-out'() { setZoom(S.zoom - 10); buildMenu(); },
  'zoom-reset'() { setZoom(100); buildMenu(); },
  fullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => toast('Schermo intero non disponibile', 'err'));
    else document.exitFullscreen();
    hideMenu();
  },
  print() { hideMenu(); window.print(); },
  lens() {
    const tab = activeTab();
    const url = tab && tab.url ? tab.url : CONFIG.hub;
    window.open('https://lens.google.com/uploadbyurl?url=' + encodeURIComponent(url), '_blank', 'noopener,noreferrer');
    hideMenu();
    toast('Google Lens aperto in una nuova scheda');
  },
  translate() { translateModal(); },
  find() { openFindBar(); },
  'find-next'() { findStep(1); },
  'find-prev'() { findStep(-1); },
  'find-close'() { closeFindBar(); },
  share() { shareModal(); },
  'more-tools'() { moreToolsModal(); },
  run(el) { runSettingAction(el.dataset.run, el); },
  'clear-history'() { clearHistory(); refreshTab(activeTab()); toast('Cronologia cancellata'); },
  'clear-downloads'() { S.downloads = []; save(); refreshTab(activeTab()); },
  'del-bookmark'(el) {
    S.bookmarks.splice(Number(el.dataset.i), 1); save(); renderBookmarksBar();
    refreshTab(activeTab());
  },
  'del-list'(el) { S.lists.splice(Number(el.dataset.i), 1); save(); refreshTab(activeTab()); },
  'del-history'(el) {
    const d = Number(el.dataset.date);
    S.history = S.history.filter((h) => h.date !== d); save(); refreshTab(activeTab());
  },
  'suggest-go'(el) { if (el.dataset.url) openUrl(el.dataset.url); else doSearch(el.dataset.q); hideSuggest(); }
};

function handleAct(act, el, e) {
  const fn = ACTIONS[act];
  if (!fn) { return false; }
  e.preventDefault();
  fn(el, e);
  return true;
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el) {
    const act = el.dataset.act;
    if (ACTIONS[act]) { handleAct(act, el, e); return; }
  }
  if (!e.target.closest('.dropdown')) { hideMenu(); hideSuggest(); }
  if (!e.target.closest('.modal-backdrop')) { /* i modali si chiudono col proprio sfondo */ }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideMenu(); hideSuggest(); closeFindBar();
    const modals = $$('#modalRoot .modal-backdrop');
    if (modals.length) modals[modals.length - 1].remove();
    return;
  }
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key.toLowerCase() === 't') { e.preventDefault(); createTab('home'); }
  else if (ctrl && e.key.toLowerCase() === 'w') { e.preventDefault(); closeTab(state.active); }
  else if (ctrl && e.key.toLowerCase() === 'l') { e.preventDefault(); $('#omni').focus(); $('#omni').select(); }
  else if (ctrl && e.key.toLowerCase() === 'h') { e.preventDefault(); ACTIONS['open-page']({ dataset: { page: 'history' } }, e); }
  else if (ctrl && e.key.toLowerCase() === 'j') { e.preventDefault(); ACTIONS['open-page']({ dataset: { page: 'downloads' } }, e); }
  else if (ctrl && e.key.toLowerCase() === 'f') { e.preventDefault(); openFindBar(); }
  else if (ctrl && e.key.toLowerCase() === 'p') { e.preventDefault(); window.print(); }
  else if (ctrl && e.shiftKey && e.key.toLowerCase() === 's') { e.preventDefault(); takeScreenshot(); }
  else if (ctrl && e.shiftKey && (e.key === 'Delete' || e.key === 'Canc')) { e.preventDefault(); ACTIONS.run({ dataset: { run: 'clear' } }, e); }
  else if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); back(); }
  else if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); forward(); }
});

/* --------------------------- omnibox events ---------------------------- */
(function wireOmni() {
  const omni = $('#omni');
  if (!omni) return;
  omni.addEventListener('input', () => showSuggest(omni));
  omni.addEventListener('blur', () => setTimeout(hideSuggest, 170));
  omni.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = omni.value.trim();
      hideSuggest();
      if (!v) return;
      if (isUrlLike(v)) openUrl(v);
      else doSearch(v);
      omni.blur();
    } else if (e.key === 'Escape') { hideSuggest(); }
  });
  omni.addEventListener('focus', () => { omni.select(); if (omni.value) showSuggest(omni); });
})();

document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  if (el.dataset.act === 'toggle') {
    const key = el.dataset.key;
    const val = !!el.checked || el.getAttribute('aria-checked') !== 'true';
    setPath(S, key, val);
    save();
    applySettings();
    if (el.getAttribute('role') === 'switch') el.setAttribute('aria-checked', String(val));
    onSettingChanged(key, val);
  } else if (el.dataset.act === 'selectset') {
    const key = el.dataset.key;
    setPath(S, key, el.value);
    save();
    applySettings();
    onSettingChanged(key, el.value);
  } else if (el.dataset.act === 'textset') {
    setPath(S, el.dataset.key, el.value);
    save();
    onSettingChanged(el.dataset.key, el.value);
  }
});

/* ------------------------- GattoGuard info ---------------------------- */
function guardInfoModal() {
  openModal('🛡 GattoGuard',
    '<p><b>Stato:</b> ' + (S.guard ? 'protezione attiva' : 'protezione disattivata') + ' · livello <b>' + esc(S.guardLevel) + '</b></p>' +
    '<p>GattoGuard controlla ogni indirizzo prima di aprirlo: connessioni non cifrate, domini a rischio, punycode e indirizzi IP sospetti. Puoi disattivarlo dalle impostazioni.</p>' +
    '<div class="set-note">Nessun dato lascia il tuo dispositivo: i controlli sono locali.</div>',
    '<button class="btn" data-close="1">Chiudi</button>' +
    '<button class="btn primary" data-act="open-settings" data-sec="privacy">Apri impostazioni protezione</button>');
  const back = $('#modalRoot .modal-backdrop:last-child');
  if (back) back.querySelectorAll('[data-close]').forEach((b) => b.onclick = () => back.remove());
}
