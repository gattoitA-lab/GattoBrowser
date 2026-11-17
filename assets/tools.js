'use strict';
/* GattoBrowser — strumenti: modali, screenshot verso l'AI, PlayHub, trova, traduci, condivisione, avvio */

/* --------------------------------- base --------------------------------- */
function openModal(title, body, footer, wide) {
  const back = document.createElement('div');
  back.className = 'modal-backdrop';
  back.innerHTML =
    '<div class="modal ' + (wide ? 'wide' : '') + '" role="dialog" aria-modal="true">' +
      '<div class="modal-h"><span>' + title + '</span><button class="x" data-close aria-label="Chiudi">✕</button></div>' +
      '<div class="modal-b">' + body + '</div>' +
      (footer ? '<div class="modal-f">' + footer + '</div>' : '') +
    '</div>';
  $('#modalRoot').appendChild(back);
  back.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => back.remove(); });
  back.addEventListener('click', (e) => { if (e.target === back) back.remove(); });
  return back;
}

async function downloadBlob(blob, name) {
  try {
    if (S.askDownloadLocation && window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({ suggestedName: name });
      const w = await handle.createWritable();
      await w.write(blob);
      await w.close();
      return true;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return false;
  }
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 6000);
  return true;
}

/* ------------------------------- IndexedDB ------------------------------- */
function idbOpen() {
  return new Promise((res, rej) => {
    if (!window.indexedDB) return rej(new Error('IndexedDB non disponibile'));
    const req = indexedDB.open('gattobrowser', 1);
    req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('media')) db.createObjectStore('media'); };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
async function idbPut(key, val) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction('media', 'readwrite');
    tx.objectStore('media').put(val, key);
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  });
}
async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction('media', 'readonly');
    const rq = tx.objectStore('media').get(key);
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}
async function idbDel(key) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction('media', 'readwrite');
    tx.objectStore('media').delete(key);
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  });
}

async function initHomeBg() {
  try {
    if (S.homeBg && S.homeBg.type === 'file') {
      const blob = await idbGet('homebg');
      if (blob) S._bgObjectUrl = URL.createObjectURL(blob);
    }
  } catch (e) { /* sfondo non disponibile */ }
}

/* ----------------------------- screenshot ------------------------------- */
const SHOT_HINT_KEY = 'gattobrowser.shot.hint';

async function takeScreenshot() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    return shotFallbackModal('Questo browser non supporta la cattura dello schermo. Usa il tasto Stampa schermo del sistema, poi incolla nella chat.');
  }
  let stream = null;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 }, audio: false, preferCurrentTab: true, selfBrowserSurface: 'include'
    });
  } catch (e) {
    return toast('Screenshot annullato', 'err');
  }
  try {
    const track = stream.getVideoTracks()[0];
    const settings = (track.getSettings && track.getSettings()) || {};
    const video = document.createElement('video');
    video.muted = true; video.playsInline = true; video.srcObject = stream;
    await video.play().catch(() => {});
    await sleep(420);
    const vw = video.videoWidth || window.innerWidth;
    const vh = video.videoHeight || window.innerHeight;
    let sx = 0, sy = 0, sw = vw, sh = vh;
    if (settings.displaySurface === 'browser') {
      const rect = $('#view').getBoundingClientRect();
      const k = vw / window.innerWidth;
      sx = Math.max(0, Math.round(rect.left * k));
      sy = Math.max(0, Math.round(rect.top * k));
      sw = Math.min(vw - sx, Math.round(rect.width * k));
      sh = Math.min(vh - sy, Math.round(rect.height * k));
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, sw);
    canvas.height = Math.max(1, sh);
    canvas.getContext('2d').drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    stream.getTracks().forEach((t) => t.stop());
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) return toast('Cattura non riuscita', 'err');
    S.downloads.unshift({ name: 'gattobrowser-' + Date.now() + '.png', kind: 'screenshot', size: blob.size, date: Date.now(), url: currentUrl() });
    S.downloads = S.downloads.slice(0, 80);
    save();
    shotModal(blob);
  } catch (e) {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    toast('Errore durante lo screenshot: ' + e.message, 'err', 4500);
  }
}

function shotFallbackModal(msg) {
  openModal('📷 Screenshot',
    '<p>' + esc(msg) + '</p>' +
    '<div class="set-note">Suggerimento: apri la chat AI in una scheda, poi trascina l\'immagine nella casella di testo.</div>',
    '<button class="btn" data-close>Chiudi</button><button class="btn primary js-chat">Apri la chat AI</button>')
    .querySelector('.js-chat').onclick = () => window.open(S.aiTarget || CONFIG.chat, '_blank', 'noopener');
}

async function copyImageToClipboard(blob) {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) return false;
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch (e) {
    return false;
  }
}

function shotModal(blob) {
  const url = currentUrl();
  const objUrl = URL.createObjectURL(blob);
  const defaultPrompt = url
    ? 'Guarda questa pagina (' + url + ') e dimmi cosa posso migliorare.'
    : 'Guarda questa schermata di GattoBrowser e dimmi cosa ne pensi.';
  const copyNote = S.autoCopyShot
    ? '<div class="shot-hint"><span class="n">1</span><div>Screenshot copiato negli appunti. La chat AI si apre in una nuova scheda: incolla con <b>Ctrl+V</b> (⌘+V su Mac) e invia.</div></div>'
    : '<div class="shot-hint"><span class="n">1</span><div>Premi “Copia immagine”, poi incolla nella chat con <b>Ctrl+V</b>.</div></div>';

  const footer =
    '<button class="btn" data-shot="copy">Copia immagine</button>' +
    '<button class="btn" data-shot="dl">Scarica PNG</button>' +
    (S.aiEnabled ? '<button class="btn primary" data-shot="ai">Apri nell\'AI →</button>' : '') +
    '<button class="btn" data-close>Chiudi</button>';

  const back = openModal('📷 Screenshot pronto',
    '<img class="shot" src="' + objUrl + '" alt="Anteprima dello screenshot">' +
    copyNote +
    '<label class="field">Messaggio per l\'AI<textarea id="shotPrompt" rows="3">' + esc(defaultPrompt) + '</textarea></label>' +
    '<div class="set-note">La chat AI è un sito esterno: GattoBrowser non può inviare al posto tuo, ma prepara immagine e messaggio con un clic.</div>',
    footer, true);

  const close = () => { back.remove(); setTimeout(() => URL.revokeObjectURL(objUrl), 800); };

  const doCopy = async () => {
    const ok = await copyImageToClipboard(blob);
    toast(ok ? 'Immagine copiata negli appunti' : 'Copia non riuscita: usa “Scarica PNG”', ok ? 'ok' : 'err');
    return ok;
  };

  const btnCopy = back.querySelector('[data-shot="copy"]');
  if (btnCopy) btnCopy.onclick = doCopy;

  back.querySelector('[data-shot="dl"]').onclick = async () => {
    const name = 'gattobrowser-screenshot-' + Date.now() + '.png';
    await downloadBlob(blob, name);
    toast('Screenshot scaricato', 'ok');
  };

  const btnAi = back.querySelector('[data-shot="ai"]');
  if (btnAi) btnAi.onclick = async () => {
    const text = back.querySelector('#shotPrompt').value.trim();
    if (S.autoCopyShot) await copyImageToClipboard(blob);
    const win = window.open(S.aiTarget || CONFIG.chat, '_blank', 'noopener');
    if (text) {
      try { await navigator.clipboard.writeText(text); } catch (e) { /* appunti non disponibili */ }
    }
    if (S.autoCopyShot) toast('Immagine copiata → incolla nella chat con Ctrl+V e invia', 'ok', 6000);
    else toast('Chat aperta: allega lo screenshot e invia', '', 5000);
    if (!win) toast('Popup bloccato: consenti le finestre per aprire la chat', 'err', 5000);
    close();
  };

  if (S.autoCopyShot) copyImageToClipboard(blob);
  const prompt = back.querySelector('#shotPrompt');
  if (prompt) prompt.focus();
}

/* -------------------------------- PlayHub ------------------------------- */
function playhubEnter() {
  if (!S.animations || S.reducedMotion) {
    openUrl(CONFIG.hub, { newTab: true });
    return;
  }
  const fx = $('#playhubFx');
  const particles = $('#fxParticles');
  if (particles) {
    particles.innerHTML = '';
    for (let i = 0; i < 26; i++) {
      const dot = document.createElement('i');
      dot.style.left = Math.random() * 100 + 'vw';
      dot.style.top = (60 + Math.random() * 40) + 'vh';
      dot.style.animationDelay = (Math.random() * 2.6).toFixed(2) + 's';
      dot.style.animationDuration = (1.8 + Math.random() * 1.6).toFixed(2) + 's';
      particles.appendChild(dot);
    }
  }
  fx.classList.add('on');
  fx.setAttribute('aria-hidden', 'false');
  const reduce = () => { fx.classList.remove('on'); fx.setAttribute('aria-hidden', 'true'); };
  setTimeout(() => {
    reduce();
    openUrl(CONFIG.hub, { newTab: true });
    toast('Benvenuto su PlayHub 🐾', 'ok');
  }, 1750);
}

/* --------------------------------- trova -------------------------------- */
const findState = { hits: [], idx: 0, query: '' };

function openFindBar() {
  const bar = $('#findbar');
  bar.classList.remove('hidden');
  const input = $('#findInput');
  input.focus(); input.select();
}
function closeFindBar() {
  $('#findbar').classList.add('hidden');
  clearFindMarks();
  findState.query = '';
  const input = $('#findInput');
  if (input) input.value = '';
  updateFindCount();
}
function clearFindMarks() {
  $$('#view mark.gbfind').forEach((m) => {
    const parent = m.parentNode;
    parent.replaceChild(document.createTextNode(m.textContent), m);
    parent.normalize();
  });
  findState.hits = [];
  findState.idx = 0;
}
function updateFindCount() {
  const c = $('#findCount');
  if (!c) return;
  c.textContent = findState.hits.length ? (findState.idx + 1) + '/' + findState.hits.length : '0/0';
}
function focusedPane() { return $('#view .pane.active'); }

function runFind(query) {
  clearFindMarks();
  findState.query = query;
  if (!query) { updateFindCount(); return; }
  const pane = focusedPane();
  if (!pane) return;
  if (pane.querySelector('iframe')) {
    toast('Il testo dentro i siti esterni non è accessibile: usa Ctrl+F del sistema per quelli', 'err', 4500);
    updateFindCount();
    return;
  }
  const walker = document.createTreeWalker(pane, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      if (/^(SCRIPT|STYLE|MARK|TEXTAREA|INPUT|SELECT)$/.test(p.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const needle = query.toLowerCase();
  nodes.forEach((node) => {
    const text = node.nodeValue;
    const low = text.toLowerCase();
    let idx = low.indexOf(needle);
    if (idx < 0) return;
    const frag = document.createDocumentFragment();
    let last = 0;
    while (idx >= 0) {
      if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)));
      const mark = document.createElement('mark');
      mark.className = 'gbfind';
      mark.textContent = text.slice(idx, idx + needle.length);
      frag.appendChild(mark);
      last = idx + needle.length;
      idx = low.indexOf(needle, last);
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
  findState.hits = $$('#view .pane.active mark.gbfind');
  findState.idx = 0;
  if (findState.hits.length) findState.hits[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
  updateFindCount();
}
function findStep(delta) {
  if (!findState.hits.length) { runFind($('#findInput').value); return; }
  findState.idx = (findState.idx + delta + findState.hits.length) % findState.hits.length;
  findState.hits[findState.idx].scrollIntoView({ block: 'center', behavior: 'smooth' });
  updateFindCount();
}

/* -------------------------------- traduci ------------------------------- */
function translateModal() {
  const langs = [['it', 'Italiano'], ['en', 'Inglese'], ['es', 'Spagnolo'], ['fr', 'Francese'], ['de', 'Tedesco'], ['ja', 'Giapponese'], ['zh-CN', 'Cinese'], ['ar', 'Arabo'], ['ru', 'Russo']];
  const back = openModal('🌐 Traduci',
    '<p>La pagina corrente si apre in Google Translate (sito esterno, nuova scheda).</p>' +
    '<label class="field">Lingua di destinazione<select id="trLang">' +
      langs.map((l) => '<option value="' + l[0] + '"' + (S.translateTarget === l[0] ? ' selected' : '') + '>' + l[1] + '</option>').join('') +
    '</select></label>' +
    '<div class="set-note">Suggerimento: attiva “Proponi di tradurre i siti stranieri” nelle impostazioni → Lingue.</div>',
    '<button class="btn" data-close>Annulla</button><button class="btn primary js-go">Traduci la pagina</button>');
  back.querySelector('.js-go').onclick = () => {
    const lang = back.querySelector('#trLang').value;
    S.translateTarget = lang; save();
    const tab = activeTab();
    if (!tab || !tab.url) return toast('Apri prima una pagina da tradurre', 'err');
    window.open('https://translate.google.com/translate?sl=auto&tl=' + encodeURIComponent(lang) + '&u=' + encodeURIComponent(tab.url), '_blank', 'noopener');
    back.remove();
  };
}

/* ------------------------------- condividi ------------------------------ */
function shareModal() {
  const tab = activeTab();
  const url = tab && tab.url ? tab.url : location.href;
  const title = tab ? tab.title : 'GattoBrowser';
  const back = openModal('📤 Trasmetti, salva e condividi',
    '<label class="field">Link della pagina<input id="shUrl" value="' + esc(url) + '" readonly></label>' +
    '<div class="row">' +
      '<button class="btn js-copy">Copia link</button>' +
      '<button class="btn js-share">Condividi…</button>' +
      '<button class="btn js-save">Salva pagina</button>' +
      '<button class="btn js-cast">Trasmetti</button>' +
    '</div>' +
    '<div class="set-note">“Salva pagina” scarica una copia HTML delle pagine interne di GattoBrowser; per i siti esterni apre la pagina in una finestra dedicata.</div>',
    '<button class="btn primary" data-close>Chiudi</button>');
  back.querySelector('.js-copy').onclick = () => navigator.clipboard.writeText(url).then(() => toast('Link copiato', 'ok')).catch(() => toast('Copia non riuscita', 'err'));
  back.querySelector('.js-share').onclick = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, url }); toast('Condiviso', 'ok'); }
      catch (e) { /* annullato */ }
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      toast('Condivisione non supportata: link copiato', 'ok');
    }
  };
  back.querySelector('.js-save').onclick = async () => {
    if (tab && tab.url && tab.kind === 'web') {
      window.open(tab.url, '_blank', 'noopener');
      return toast('Pagina aperta in una finestra dedicata', '');
    }
    const pane = focusedPane();
    const html = '<!DOCTYPE html><meta charset="utf-8"><title>' + esc(title) + '</title>' + (pane ? pane.innerHTML : '');
    await downloadBlob(new Blob([html], { type: 'text/html' }), 'gattobrowser-pagina-' + Date.now() + '.html');
    toast('Pagina salvata', 'ok');
  };
  back.querySelector('.js-cast').onclick = () => {
    if (navigator.presentation && navigator.presentation.defaultRequest) {
      navigator.presentation.defaultRequest()
        .then(() => toast('Richiesta di trasmissione inviata', 'ok'))
        .catch(() => toast('Nessun dispositivo di trasmissione disponibile', 'err'));
    } else {
      toast('Trasmissione non supportata da questo dispositivo', 'err');
    }
  };
}

/* ----------------------------- altri strumenti -------------------------- */
function moreToolsModal() {
  const back = openModal('🧰 Altri strumenti',
    '<div class="list">' +
      '<button class="list-item" data-act="shot"><span class="ico">📷</span><div class="main"><b>Screenshot → AI</b><small>Cattura la pagina e prepara l\'invio</small></div></button>' +
      '<button class="list-item js-open-win"><span class="ico">↗</span><div class="main"><b>Apri in una finestra</b><small>Per i siti che bloccano l\'incorporamento</small></div></button>' +
      '<button class="list-item js-url-info"><span class="ico">🔗</span><div class="main"><b>Informazioni sull\'URL</b><small>Protocollo, dominio, percorso, parametri</small></div></button>' +
      '<button class="list-item" data-act="run" data-run="extensions"><span class="ico">🧩</span><div class="main"><b>Estensioni</b><small>GattoGuard, blocco popup, tema scuro</small></div></button>' +
      '<button class="list-item" data-act="run" data-run="groups"><span class="ico">🗂</span><div class="main"><b>Gruppi di schede</b><small>Salva e riapri gruppi di schede</small></div></button>' +
      '<button class="list-item js-note"><span class="ico">📝</span><div class="main"><b>Note rapide</b><small>Appunti salvati sul dispositivo</small></div></button>' +
      '<button class="list-item" data-act="zoom-reset"><span class="ico">🔍</span><div class="main"><b>Ripristina lo zoom</b><small>Torna al 100%</small></div></button>' +
      '<button class="list-item" data-act="run" data-run="clear"><span class="ico">🗑</span><div class="main"><b>Elimina dati di navigazione</b><small>Cronologia, download, cache</small></div></button>' +
    '</div>',
    '<button class="btn primary" data-close>Chiudi</button>');
  back.querySelector('.js-open-win').onclick = () => {
    const tab = activeTab();
    if (!tab || !tab.url) return toast('Nessuna pagina aperta', 'err');
    window.open(tab.url, '_blank', 'noopener');
    back.remove();
  };
  back.querySelector('.js-url-info').onclick = () => { back.remove(); urlInfoModal(); };
  back.querySelector('.js-note').onclick = () => { back.remove(); quickNoteModal(); };
}

function urlInfoModal() {
  const tab = activeTab();
  if (!tab || !tab.url) return toast('Apri prima una pagina', 'err');
  let u;
  try { u = new URL(tab.url); } catch (e) { return toast('URL non valido', 'err'); }
  const params = [];
  u.searchParams.forEach((v, k) => params.push([k, v]));
  const rows = [
    ['URL completo', u.href],
    ['Protocollo', u.protocol.replace(':', '')],
    ['Dominio', u.hostname],
    ['Porta', u.port || 'predefinita'],
    ['Percorso', u.pathname],
    ['Ancora', u.hash || '—'],
    ['Parametri', params.length ? params.map((p) => p[0] + ' = ' + p[1]).join('\n') : '—'],
    ['GattoGuard', guardCheck(tab.url).ok ? 'nessun rischio rilevante' : 'rischio ' + guardCheck(tab.url).score + '/10'],
    ['HTTPS', u.protocol === 'https:' ? 'sì 🔒' : 'no ⚠']
  ];
  openModal('🔗 Informazioni sull\'URL',
    '<div class="list">' + rows.map((r) =>
      '<div class="list-item"><div class="main"><b>' + esc(r[0]) + '</b><small style="white-space:pre-wrap">' + esc(r[1]) + '</small></div></div>'
    ).join('') + '</div>',
    '<button class="btn primary" data-close>Chiudi</button>');
}

function quickNoteModal() {
  const KEY = 'gattobrowser.notes';
  const value = localStorage.getItem(KEY) || '';
  const back = openModal('📝 Note rapide',
    '<label class="field">Appunti<textarea id="qnText" rows="7">' + esc(value) + '</textarea></label>' +
    '<div class="set-note">Le note restano su questo dispositivo.</div>',
    '<button class="btn danger js-del">Cancella</button><button class="btn primary js-save">Salva</button>');
  back.querySelector('.js-save').onclick = () => {
    localStorage.setItem(KEY, back.querySelector('#qnText').value);
    back.remove(); toast('Note salvate', 'ok');
  };
  back.querySelector('.js-del').onclick = () => {
    localStorage.removeItem(KEY); back.querySelector('#qnText').value = ''; toast('Note cancellate');
  };
}

/* ------------------------------ install PWA ----------------------------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

function guessOS() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return 'linux';
  if (/Mac/i.test(ua)) return 'mac';
  return 'win';
}

function installPwa() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choice) => {
      toast(choice.outcome === 'accepted' ? 'GattoBrowser installato 🐾' : 'Installazione annullata', choice.outcome === 'accepted' ? 'ok' : '');
      deferredPrompt = null;
    });
    return;
  }
  osGuide(guessOS());
}

/* --------------------------------- tick --------------------------------- */
function memorySaverTick() {
  if (!S.memorySaver) return;
  const limit = (Number(S.memorySaverMinutes) || 5) * 60000;
  const now = Date.now();
  state.tabs.forEach((t) => {
    if (t.kind === 'web' && t.id !== state.active && t.frame && !t.suspended && now - (t.lastActive || 0) > limit) suspendTab(t);
  });
}

function startTicks() {
  setInterval(() => {
    const mem = $('#memInfo');
    if (mem) mem.textContent = 'RAM ' + memEstimate();
    const perf = $('#perfMem');
    if (perf) perf.textContent = memEstimate();
    const sys = $('#sysMem');
    if (sys) sys.textContent = memEstimate();
    const tab = activeTab();
    if (tab && tab.kind === 'web' && tab.url) {
      $('#statusMsg').textContent = (guardCheck(tab.url).ok ? '🔒 ' : '⚠ ') + prettyHost(tab.url);
    }
  }, 4000);
  setInterval(memorySaverTick, 60000);
  setTimeout(memorySaverTick, 8000);
}

/* ------------------------------- extra UI ------------------------------- */
function wireFindInput() {
  const input = $('#findInput');
  if (!input) return;
  let timer = null;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const v = input.value;
    timer = setTimeout(() => runFind(v), 200);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); findStep(e.shiftKey ? -1 : 1); }
  });
}

/* ------------------------------- startup -------------------------------- */
async function restoreStartup() {
  if (S.startup === 'links' && S.startupLinks.length) {
    S.startupLinks.slice(0, 6).forEach((u) => {
      const tab = createTab('home');
      navigate(tab, u, { replace: true });
    });
    return;
  }
  if (S.startup === 'restore') {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.tabs && data.tabs.length) {
          data.tabs.slice(0, 8).forEach((t) => {
            if (t.kind === 'web' && t.url) {
              const tab = createTab('home');
              navigate(tab, t.url, { replace: true });
            } else if (t.kind === 'search' && t.query) {
              createTab('search', { query: t.query, title: 'GattoSearch: ' + t.query });
            } else {
              createTab('home');
            }
          });
          const idx = Math.min(Math.max(0, Number(data.active) || 0), state.tabs.length - 1);
          activateTab(state.tabs[idx].id);
          return;
        }
      }
    } catch (e) { /* sessione non valida */ }
  }
  createTab('home');
}

function registerSW() {
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

(async function boot() {
  S = loadSettings();
  await initHomeBg();
  applySettings();
  wireFindInput();
  await restoreStartup();
  startTicks();
  registerSW();
  if (S.translateSites && S.language === 'it') { /* promemoria: avviso al primo sito straniero */ }

  window.addEventListener('beforeunload', () => {
    if (S.clearOnExit) {
      S.history = []; S.downloads = [];
      try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* noop */ }
    }
    saveSession();
  });

  document.addEventListener('visibilitychange', () => { if (document.hidden) saveSession(); });

  // tutorial screenshot: solo la prima volta
  if (!localStorage.getItem(SHOT_HINT_KEY)) {
    setTimeout(() => {
      toast('Novità: premi 📷 per portare la pagina nella chat AI', '', 6000);
      localStorage.setItem(SHOT_HINT_KEY, '1');
    }, 2600);
  }
})();
