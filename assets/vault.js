'use strict';
/* =====================================================================
   Cassaforte GattoHub — password e dati dei moduli legati al profilo
   Crittografia AES-256-GCM con chiave derivata (PBKDF2, 150k iterazioni).
   I dati restano cifrati sul dispositivo e si spostano con Esporta/Importa.
   ===================================================================== */

const VAULT_KEY = 'gattobrowser.vault.v1';
let vaultKey = null;      // chiave in memoria (mai salvata)
let vaultItems = null;    // elementi decifrati in memoria

function b64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function unb64(str) {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function vaultMeta() {
  try { return JSON.parse(localStorage.getItem(VAULT_KEY) || 'null'); }
  catch (e) { return null; }
}
function vaultExists() { return !!vaultMeta(); }
function vaultIsUnlocked() { return !!vaultKey && Array.isArray(vaultItems); }

function vaultCryptoOK() {
  return !!(window.crypto && window.crypto.subtle && window.isSecureContext);
}

async function vaultKeyFrom(password, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function vaultPayload() {
  return JSON.stringify({
    profile: { name: S.profileName, email: S.profileEmail },
    items: vaultItems,
    savedAt: Date.now()
  });
}

async function vaultWrite(salt, key, payload) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(payload));
  localStorage.setItem(VAULT_KEY, JSON.stringify({ v: 1, salt: b64(salt), iv: b64(iv), data: b64(ct), updated: Date.now() }));
}

async function vaultCreate(masterPassword) {
  if (!vaultCryptoOK()) throw new Error('La cassaforte richiede HTTPS (su GitHub Pages funziona)');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await vaultKeyFrom(masterPassword, salt);
  vaultKey = key;
  vaultItems = [];
  await vaultWrite(salt, key, vaultPayload());
}

async function vaultUnlock(masterPassword) {
  const meta = vaultMeta();
  if (!meta) throw new Error('Cassaforte non ancora creata');
  const key = await vaultKeyFrom(masterPassword, unb64(meta.salt));
  let plain;
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(meta.iv) }, key, unb64(meta.data));
  } catch (e) {
    throw new Error('Password principale errata');
  }
  const parsed = JSON.parse(new TextDecoder().decode(plain));
  vaultKey = key;
  vaultItems = Array.isArray(parsed.items) ? parsed.items : [];
  return parsed;
}

async function vaultPersist() {
  const meta = vaultMeta();
  if (!meta || !vaultKey) throw new Error('Cassaforte bloccata');
  await vaultWrite(unb64(meta.salt), vaultKey, vaultPayload());
}

function vaultLock() { vaultKey = null; vaultItems = null; }

async function vaultAdd(item) {
  if (!vaultIsUnlocked()) throw new Error('Sblocca prima la cassaforte');
  vaultItems.unshift({
    id: (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now() + Math.random().toString(16).slice(2)),
    site: item.site || '',
    url: item.url || '',
    username: item.username || '',
    password: item.password || '',
    note: item.note || '',
    updated: Date.now()
  });
  await vaultPersist();
}
async function vaultRemove(id) {
  if (!vaultIsUnlocked()) return;
  vaultItems = vaultItems.filter((i) => i.id !== id);
  await vaultPersist();
}
function vaultForHost(host) {
  if (!host || !vaultIsUnlocked()) return [];
  const h = String(host).toLowerCase().replace(/^www\./, '');
  return vaultItems.filter((it) => {
    let itemHost = '';
    if (it.url) { try { itemHost = new URL(normalizeUrl(it.url)).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { itemHost = ''; } }
    if (itemHost && (itemHost === h || h.endsWith('.' + itemHost) || itemHost.endsWith('.' + h))) return true;
    return (it.site || '').toLowerCase().replace(/^www\./, '') === h;
  });
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e2) { return false; }
  }
}

function genPassword(len) {
  const abc = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*+-?';
  const arr = new Uint32Array(len || 18);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < arr.length; i++) out += abc[arr[i] % abc.length];
  return out;
}

/* ----------------------------- interfaccia ----------------------------- */
function vaultProfileLine() {
  return 'Profilo GattoHub: <b>' + esc(S.profileName) + '</b> · ' + esc(S.profileEmail || 'email non impostata');
}

function vaultItemsHTML() {
  if (!vaultItems || !vaultItems.length) {
    return '<div class="set-row"><div class="txt"><small>La cassaforte è vuota: aggiungi la prima password.</small></div></div>';
  }
  return vaultItems.map((it) =>
    '<div class="set-row" data-vault-row="' + esc(it.id) + '">' +
      '<div class="txt"><b>' + esc(it.site || prettyHost(it.url) || 'Sito') + '</b>' +
        '<small>' + esc(it.username || 'utente non indicato') + ' · <span class="vault-pass" data-pass="' + esc(it.id) + '">••••••••</span>' +
        (it.note ? ' · ' + esc(it.note) : '') + '</small></div>' +
      '<div class="ctl">' +
        '<button class="btn sm" data-vault="copy-user" data-id="' + esc(it.id) + '" title="Copia utente">👤</button>' +
        '<button class="btn sm" data-vault="copy-pass" data-id="' + esc(it.id) + '" title="Copia password">🔑</button>' +
        '<button class="btn sm" data-vault="reveal" data-id="' + esc(it.id) + '" title="Mostra/nascondi">👁</button>' +
        '<button class="btn sm danger" data-vault="del" data-id="' + esc(it.id) + '" title="Elimina">✕</button>' +
      '</div>' +
    '</div>'
  ).join('');
}

function vaultCardHTML() {
  const meta = vaultMeta();
  const unlocked = vaultIsUnlocked();
  let inner = '';

  if (!meta) {
    inner =
      '<div class="set-row"><div class="txt"><b>🔐 Cassaforte di ' + esc(S.profileName) + '</b>' +
        '<small>Salva password e dati dei moduli con crittografia AES-256, legati al tuo profilo GattoHub. Si apre con una password principale che scegli tu.</small></div>' +
        '<div class="ctl"><button class="btn sm primary" data-vault="create">Attiva cassaforte</button></div></div>';
  } else if (!unlocked) {
    inner =
      '<div class="set-row"><div class="txt"><b>🔒 Cassaforte bloccata</b>' +
        '<small>' + vaultProfileLine() + ' · ultimo salvataggio ' + esc(fmtTime(meta.updated)) + '</small></div>' +
        '<div class="ctl"><button class="btn sm primary" data-vault="unlock">Sblocca</button>' +
        '<button class="btn sm danger" data-vault="wipe">Elimina</button></div></div>';
  } else {
    inner =
      '<div class="set-row"><div class="txt"><b>🔓 Cassaforte sbloccata · ' + vaultItems.length + ' elementi</b>' +
        '<small>' + vaultProfileLine() + '</small></div>' +
        '<div class="ctl"><button class="btn sm primary" data-vault="add">＋ Nuova</button>' +
        '<button class="btn sm" data-vault="lock">Blocca</button>' +
        '<button class="btn sm" data-vault="export">Esporta</button>' +
        '<button class="btn sm" data-vault="import">Importa</button></div></div>' +
      vaultItemsHTML();
  }

  return '<div class="set-card" id="vaultCard">' +
    '<div class="set-row" style="background:linear-gradient(90deg,rgba(0,255,102,.07),transparent)">' +
      '<div class="txt"><b>Cassaforte GattoHub</b><small>Le credenziali sono legate al profilo e cifrate sul dispositivo; nessun server le vede.</small></div>' +
      '<div class="ctl"><span class="badge ' + (unlocked ? 'ok' : '') + '">' + (unlocked ? 'sbloccata' : 'protetta') + '</span></div>' +
    '</div>' + inner + '</div>' +
    '<div class="set-note">🔐 Crittografia AES-256-GCM con chiave PBKDF2 (150 000 iterazioni). La password principale non viene mai salvata: se la dimentichi, i dati non si possono recuperare. Usa <b>Esporta</b> per un backup cifrato da importare su un altro dispositivo.</div>';
}

function mountVault(root) {
  const host = root ? root.querySelector('#vaultHost') : $('#vaultHost');
  if (!host) return;
  host.innerHTML = vaultCardHTML();
  host.onclick = (e) => {
    const btn = e.target.closest('[data-vault]');
    if (!btn) return;
    handleVaultAction(btn.dataset.vault, btn);
  };
}

async function handleVaultAction(action, btn) {
  try {
    if (action === 'create') return vaultCreateModal();
    if (action === 'unlock') return vaultUnlockModal();
    if (action === 'lock') { vaultLock(); refreshSettingsPane(); return toast('Cassaforte bloccata'); }
    if (action === 'add') return credentialModal();
    if (action === 'export') return vaultExport();
    if (action === 'import') return vaultImport();
    if (action === 'wipe') return vaultWipeModal();
    if (action === 'del') {
      await vaultRemove(btn.dataset.id);
      refreshSettingsPane();
      return toast('Credenziale eliminata');
    }
    if (action === 'reveal') {
      const item = (vaultItems || []).find((i) => i.id === btn.dataset.id);
      if (!item) return;
      const span = document.querySelector('.vault-pass[data-pass="' + btn.dataset.id + '"]');
      if (!span) return;
      const shown = span.textContent !== '••••••••';
      span.textContent = shown ? '••••••••' : item.password;
      return;
    }
    if (action === 'copy-user' || action === 'copy-pass') {
      const item = (vaultItems || []).find((i) => i.id === btn.dataset.id);
      if (!item) return;
      const value = action === 'copy-user' ? item.username : item.password;
      if (!value) return toast('Nessun dato salvato per questo campo', 'err');
      const ok = await copyText(value);
      return toast(ok ? (action === 'copy-user' ? 'Utente copiato' : 'Password copiata') : 'Copia non riuscita', ok ? 'ok' : 'err');
    }
  } catch (e) {
    toast(e.message || 'Errore della cassaforte', 'err', 4500);
  }
}

/* ------------------------------- modali -------------------------------- */
function vaultCreateModal() {
  const back = openModal('🔐 Attiva la cassaforte GattoHub',
    '<p>Scegli una <b>password principale</b>: protegge tutte le credenziali salvate nel profilo <b>' + esc(S.profileName) + '</b>.</p>' +
    '<label class="field">Password principale<input id="vcPass" type="password" autocomplete="new-password" placeholder="almeno 8 caratteri"></label>' +
    '<label class="field">Ripeti la password<input id="vcPass2" type="password" autocomplete="new-password"></label>' +
    '<div class="set-note">⚠️ Non possiamo recuperarla: se la dimentichi, la cassaforte resta chiusa. Salva un backup con “Esporta” dopo averla creata.</div>',
    '<button class="btn" data-close>Annulla</button><button class="btn primary js-go">Crea cassaforte</button>');
  back.querySelector('.js-go').onclick = async () => {
    const p1 = back.querySelector('#vcPass').value;
    const p2 = back.querySelector('#vcPass2').value;
    if (p1.length < 8) return toast('Usa almeno 8 caratteri', 'err');
    if (p1 !== p2) return toast('Le due password non coincidono', 'err');
    try {
      await vaultCreate(p1);
      back.remove();
      refreshSettingsPane();
      toast('Cassaforte creata: ora puoi salvare password', 'ok');
    } catch (e) { toast(e.message, 'err', 5000); }
  };
}

function vaultUnlockModal() {
  const back = openModal('🔓 Sblocca la cassaforte',
    '<p>Inserisci la password principale per leggere le credenziali del profilo <b>' + esc(S.profileName) + '</b>.</p>' +
    '<label class="field">Password principale<input id="vuPass" type="password" autocomplete="current-password"></label>',
    '<button class="btn" data-close>Annulla</button><button class="btn primary js-go">Sblocca</button>');
  const go = async () => {
    try {
      await vaultUnlock(back.querySelector('#vuPass').value);
      back.remove();
      refreshSettingsPane();
      toast('Cassaforte sbloccata', 'ok');
    } catch (e) { toast(e.message, 'err'); }
  };
  back.querySelector('.js-go').onclick = go;
  const input = back.querySelector('#vuPass');
  input.focus();
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
}

function credentialModal(prefill) {
  if (!vaultIsUnlocked()) { vaultUnlockModal(); return; }
  const tab = activeTab();
  const site = (prefill && prefill.site) || (tab && tab.url ? prettyHost(tab.url) : '');
  const url = (prefill && prefill.url) || (tab && tab.url ? tab.url : '');
  const back = openModal('🔑 Nuova credenziale',
    '<p>Viene salvata nella cassaforte del profilo <b>' + esc(S.profileName) + '</b>.</p>' +
    '<label class="field">Sito<input id="crSite" value="' + esc(site) + '" placeholder="GattoHub"></label>' +
    '<label class="field">Indirizzo<input id="crUrl" value="' + esc(url) + '" placeholder="https://…"></label>' +
    '<label class="field">Nome utente / email<input id="crUser" autocomplete="off"></label>' +
    '<label class="field">Password<div class="row" style="flex-wrap:nowrap"><input id="crPass" type="text" autocomplete="new-password" style="flex:1"><button class="btn sm" id="crGen" type="button">Genera</button></div></label>' +
    '<label class="field">Nota (opzionale)<input id="crNote"></label>',
    '<button class="btn" data-close>Annulla</button><button class="btn primary js-go">Salva nella cassaforte</button>', true);
  back.querySelector('#crGen').onclick = () => { back.querySelector('#crPass').value = genPassword(18); };
  back.querySelector('.js-go').onclick = async () => {
    const password = back.querySelector('#crPass').value;
    const username = back.querySelector('#crUser').value.trim();
    if (!username || !password) return toast('Utente e password sono obbligatori', 'err');
    try {
      await vaultAdd({
        site: back.querySelector('#crSite').value.trim() || prettyHost(back.querySelector('#crUrl').value),
        url: normalizeUrl(back.querySelector('#crUrl').value.trim()),
        username: username,
        password: password,
        note: back.querySelector('#crNote').value.trim()
      });
      back.remove();
      refreshSettingsPane();
      const t = activeTab();
      if (t && t.kind === 'web') refreshTab(t);
      toast('Credenziale salvata nella cassaforte di ' + S.profileName, 'ok');
    } catch (e) { toast(e.message, 'err'); }
  };
}

function vaultWipeModal() {
  const back = openModal('Eliminare la cassaforte?',
    '<p>Verranno cancellate <b>tutte le credenziali</b> del profilo ' + esc(S.profileName) + '. L\'operazione non si può annullare.</p>',
    '<button class="btn" data-close>Annulla</button><button class="btn danger js-go">Elimina</button>');
  back.querySelector('.js-go').onclick = () => {
    localStorage.removeItem(VAULT_KEY);
    vaultLock();
    back.remove();
    refreshSettingsPane();
    toast('Cassaforte eliminata');
  };
}

function vaultExport() {
  const meta = vaultMeta();
  if (!meta) return toast('Crea prima la cassaforte', 'err');
  const blob = new Blob([JSON.stringify({ kind: 'gattobrowser-vault', ...meta }, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'gattobrowser-cassaforte-' + new Date().toISOString().slice(0, 10) + '.json');
  toast('Backup cifrato esportato', 'ok');
}

function vaultImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || !data.salt || !data.iv || !data.data) throw new Error('File non valido');
      localStorage.setItem(VAULT_KEY, JSON.stringify({ v: 1, salt: data.salt, iv: data.iv, data: data.data, updated: Date.now() }));
      vaultLock();
      refreshSettingsPane();
      toast('Cassaforte importata: sbloccala con la sua password', 'ok');
    } catch (e) { toast('Importazione non riuscita: ' + e.message, 'err', 4500); }
  };
  input.click();
}

/* ------------------- credenziali nella scheda del sito ------------------- */
function renderCredentialBar(tab) {
  if (!vaultIsUnlocked() || !tab || !tab.url) return;
  const host = hostOf(tab.url);
  const items = vaultForHost(host);
  if (!items.length || !tab.pane) return;
  const hostEl = tab.pane.querySelector('.web-host');
  if (!hostEl) return;
  const bar = document.createElement('div');
  bar.className = 'embed-note';
  bar.innerHTML = '🔑 <b>' + items.length + '</b> credenziali della cassaforte per ' + esc(host) + '. ' +
    '<button data-copycred="user">Copia utente</button><button data-copycred="pass">Copia password</button>';
  hostEl.insertBefore(bar, hostEl.firstChild);
  bar.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copycred]');
    if (!btn) return;
    const it = items[0];
    const value = btn.dataset.copycred === 'user' ? it.username : it.password;
    const ok = await copyText(value || '');
    toast(ok ? (btn.dataset.copycred === 'user' ? 'Utente copiato' : 'Password copiata') + ' — incollalo nel modulo' : 'Copia non riuscita', ok ? 'ok' : 'err', 4000);
  });
}
