'use strict';
/* GattoBrowser — Impostazioni: 13 sezioni, tutte collegate allo stato reale */

const SETTINGS_SECTIONS = [
  { id: 'account', icon: '🐱', label: 'Tu e GattoHub' },
  { id: 'autofill', icon: '🔑', label: 'Compilazione automatica e password' },
  { id: 'privacy', icon: '🛡', label: 'Privacy e sicurezza' },
  { id: 'perf', icon: '⚡', label: 'Prestazioni' },
  { id: 'ai', icon: '✨', label: "Innovazioni dell'AI" },
  { id: 'look', icon: '🎨', label: 'Aspetto' },
  { id: 'search', icon: '🔍', label: 'Motore di ricerca' },
  { id: 'default', icon: '🖥', label: 'Browser predefinito' },
  { id: 'startup', icon: '🚀', label: "All'avvio" },
  { id: 'lang', icon: '🌐', label: 'Lingue' },
  { id: 'down', icon: '⬇', label: 'Download' },
  { id: 'a11y', icon: '♿', label: 'Accessibilità' },
  { id: 'system', icon: '⚙', label: 'Sistema' }
];

const uT = (key, label, desc) =>
  '<div class="set-row"><div class="txt"><b>' + label + '</b>' + (desc ? '<small>' + desc + '</small>' : '') + '</div>' +
  '<div class="ctl"><button class="switch" role="switch" aria-checked="' + (!!getPath(S, key)) + '" data-act="toggle" data-key="' + key + '" aria-label="' + label + '"></button></div></div>';

const uS = (key, label, desc, opts) =>
  '<div class="set-row"><div class="txt"><b>' + label + '</b>' + (desc ? '<small>' + desc + '</small>' : '') + '</div>' +
  '<div class="ctl"><select class="mini" data-act="selectset" data-key="' + key + '">' +
  opts.map((o) => '<option value="' + esc(o[0]) + '"' + (String(getPath(S, key)) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') +
  '</select></div></div>';

const uB = (label, desc, run, txt) =>
  '<div class="set-row"><div class="txt"><b>' + label + '</b>' + (desc ? '<small>' + desc + '</small>' : '') + '</div>' +
  '<div class="ctl"><button class="btn sm" data-act="run" data-run="' + run + '">' + esc(txt || 'Apri') + '</button></div></div>';

const uI = (label, val, cls) =>
  '<div class="set-row"><div class="txt"><b>' + label + '</b></div><div class="ctl"><span class="badge ' + (cls || '') + '">' + val + '</span></div></div>';

function identityRows() {
  if (!S.savedIdentities.length) return '<div class="set-row"><div class="txt"><small>Nessun profilo di compilazione salvato.</small></div></div>';
  return S.savedIdentities.map((id, i) =>
    '<div class="set-row"><div class="txt"><b>' + esc(id.name) + '</b><small>' + esc(id.email) + (id.address ? ' · ' + esc(id.address) : '') + '</small></div>' +
    '<div class="ctl"><button class="btn sm danger" data-act="run" data-run="identity-del" data-i="' + i + '">Rimuovi</button></div></div>'
  ).join('');
}
function startupRows() {
  if (!S.startupLinks.length) return '<div class="set-row"><div class="txt"><small>Nessun link di avvio.</small></div></div>';
  return S.startupLinks.map((u, i) =>
    '<div class="set-row"><div class="txt"><b>' + esc(prettyHost(u)) + '</b><small>' + esc(u) + '</small></div>' +
    '<div class="ctl"><button class="btn sm danger" data-act="run" data-run="startup-del" data-i="' + i + '">✕</button></div></div>'
  ).join('');
}
function homeBgBadge() {
  const t = S.homeBg ? S.homeBg.type : 'gradient';
  return { gradient: 'sfumatura Gatto', file: 'file locale', url: 'link esterno' }[t] || t;
}

function settingsSectionHTML(id) {
  switch (id) {
    case 'account':
      return '<h3>Tu e GattoHub</h3>' +
        '<div class="set-card">' +
          '<div class="set-row"><div class="ctl"><div style="width:40px;height:40px;border-radius:50%;background:var(--accent);color:#04140a;display:grid;place-items:center;font-weight:700">' + esc(favLetter(S.profileName)) + '</div></div>' +
            '<div class="txt"><b>' + esc(S.profileName) + '</b><small>' + esc(S.profileEmail) + '</small></div>' +
            '<div class="ctl"><span class="pill">Accesso effettuato</span></div></div>' +
          uB('Servizi GattoHub', 'Giochi, app e minigiochi nel browser', 'hub', 'Apri GattoHub') +
          uB('Personalizza il profilo', 'Nome e email mostrati nel menu', 'profile', 'Modifica') +
          uB('Chat AI di GattoHub', 'La chat dove finiscono i tuoi screenshot', 'ai-open', 'Apri chat') +
          uB('Importa preferiti e impostazioni', 'Da un file JSON esportato da GattoBrowser', 'import', 'Importa') +
          uB('Esporta impostazioni', 'Salva un backup delle tue preferenze', 'export', 'Esporta') +
          uB('Ripristina tutto', 'Riporta GattoBrowser allo stato iniziale', 'resetall', 'Reset') +
        '</div>' +
        '<div class="set-note">GattoBrowser è un progetto di GattoHub. I tuoi dati (preferiti, cronologia, sfondi) restano solo su questo dispositivo.</div>';

    case 'autofill':
      return '<h3>Compilazione automatica e password</h3>' +
        '<div class="set-card">' +
          uT('autofill', 'Compilazione automatica', 'Riempi i moduli con i profili salvati qui sotto.') +
          uT('saveForms', 'Chiedi di salvare i moduli compilati', 'Quando compili un modulo, proponi di memorizzarlo.') +
          uB('Aggiungi un profilo', 'Nome, email e indirizzo per la compilazione', 'identity-add', '＋ Aggiungi') +
          identityRows() +
        '</div>' +
        '<div class="set-note">🔒 GattoBrowser non salva password in chiaro: usa la cassaforte del sistema operativo. Se disattivi la compilazione automatica, i profili restano salvati ma non vengono proposti.</div>';

    case 'privacy':
      return '<h3>Privacy e sicurezza</h3>' +
        '<div class="set-card">' +
          uT('guard', 'GattoGuard (anti-virus)', 'Controlla ogni URL prima di aprirlo: HTTP, domini a rischio, punycode, IP.') +
          uS('guardLevel', 'Sensibilità del controllo', 'Quanto deve essere severo GattoGuard', [['basso', 'Bassa (solo rischi evidenti)'], ['medio', 'Media (consigliata)'], ['alto', 'Alta (blocca molto)']]) +
          uT('blockPopups', 'Blocca le finestre pop-up', 'Impedisce l\'apertura automatica di finestre da siti aperti.') +
          uT('doNotTrack', 'Invia “Non tracciare”', 'Segnala ai siti di non profilarti.') +
          uT('clearOnExit', 'Elimina i dati alla chiusura', 'Cancella cronologia e download quando chiudi l\'app.') +
          uB('Estensioni integrate', 'GattoGuard, blocco popup, tema scuro per siti, note', 'extensions', 'Gestisci') +
          uB('Elimina dati di navigazione', 'Scegli cosa cancellare', 'clear', 'Elimina…') +
          uB('Verifica un indirizzo', 'Prova GattoGuard su un URL', 'guard-test', 'Prova') +
        '</div>' +
        '<div class="set-note">I siti aperti nelle schede restano siti di terze parti: i loro cookie e tracker sono gestiti dal motore del sistema.</div>';

    case 'perf':
      return '<h3>Prestazioni</h3>' +
        '<div class="set-card">' +
          uT('memorySaver', 'Risparmio memoria', 'Sospende le schede inattive per liberare RAM.') +
          uS('memorySaverMinutes', 'Sospendi dopo', 'Tempo di inattività prima della sospensione', [['2', '2 minuti'], ['5', '5 minuti'], ['10', '10 minuti'], ['30', '30 minuti']]) +
          uT('prefetch', 'Precarica i collegamenti', 'Prepara le pagine più usate della home.') +
          uT('savingsMode', 'Modalità risparmio energia', 'Meno animazioni, schede sospese prima.') +
          uB('Sospendi ora le schede inattive', 'Libera memoria immediatamente', 'suspend', 'Sospendi') +
          uI('Memoria JS in uso', '<span id="perfMem">' + memEstimate() + '</span>') +
          uI('Schede aperte', String(state.tabs.length)) +
          uI('Motore di rendering', 'motore del sistema') +
        '</div>' +
        '<div class="set-note">GattoBrowser non installa un motore separato: usa quello già presente nel sistema, così consuma pochissima RAM in più. Con 5 schede tipiche la memoria JS resta sotto i 40 MB.</div>';

    case 'ai':
      return '<h3>Innovazioni dell\'AI</h3>' +
        '<div class="set-card">' +
          uT('aiEnabled', 'Screenshot → AI', 'Mostra il pulsante che porta la pagina nella chat AI.') +
          uT('autoCopyShot', 'Copia lo screenshot negli appunti', 'Dopo la cattura l\'immagine è pronta da incollare.') +
          uS('aiModel', 'Stile di risposta preferito', 'Viene ricordato nella chat', [['meow-smart', 'Meow Smart'], ['meow-fast', 'Meow Fast'], ['meow-creative', 'Meow Creative']]) +
          '<div class="set-row vertical"><div class="txt"><b>Indirizzo della chat AI</b><small>Dove si apre la chat quando premi “Apri nell\'AI”</small></div>' +
            '<input class="mini" data-act="textset" data-key="aiTarget" value="' + esc(S.aiTarget) + '" style="width:100%"></div>' +
          uB('Apri la chat AI', CONFIG.chat, 'ai-open', 'Apri') +
          uB('Prova lo screenshot', 'Cattura la pagina e prepara l\'invio', 'shot', '📷 Cattura') +
        '</div>' +
        '<div class="set-note">La chat è un servizio esterno: GattoBrowser copia l\'immagine negli appunti e apre la chat, poi incolli con Ctrl+V (⌘+V su Mac).</div>';

    case 'look':
      return '<h3>Aspetto</h3>' +
        '<div class="set-card">' +
          uS('theme', 'Tema', 'Colori dell\'interfaccia', [['dark', 'Scuro'], ['light', 'Chiaro'], ['auto', 'Come il sistema']]) +
          '<div class="set-row"><div class="txt"><b>Colore principale</b><small>Accento di pulsanti, schede e link</small></div>' +
            '<div class="ctl"><input type="color" data-act="textset" data-key="accent" value="' + esc(S.accent) + '"></div></div>' +
          uT('animations', 'Animazioni', 'Transizioni e ingresso animato su PlayHub') +
          uT('showBookmarksBar', 'Mostra la barra dei preferiti', 'Sotto la barra degli indirizzi') +
          '<div class="set-row"><div class="txt"><b>Sfondo della pagina iniziale</b><small>Immagine, video o sfumatura · ' + esc(homeBgBadge()) + '</small></div>' +
            '<div class="ctl"><button class="btn sm" data-act="run" data-run="bg-edit">Cambia</button></div></div>' +
          uB('Collegamenti della home', S.homeLinks.length + ' collegamenti salvati', 'links-manage', 'Gestisci') +
          uB('Anteprima pagina iniziale', 'Apri una nuova scheda', 'newtab', 'Apri') +
        '</div>';

    case 'search':
      return '<h3>Motore di ricerca</h3>' +
        '<div class="set-card">' +
          uS('searchEngine', 'Motore predefinito', 'Usato dalla barra degli indirizzi', Object.keys(ENGINES).map((k) => [k, ENGINES[k].label + ' · ' + ENGINES[k].tag])) +
          uT('suggestions', 'Suggerimenti durante la digitazione', 'Cronologia, preferiti e ricerche') +
          uT('resultsNewTab', 'Apri i risultati in una nuova scheda', 'Utile per confrontare i motori') +
          uB('Prova GattoSearch', 'Ricerca con indice libero Wikipedia + DuckDuckGo', 'try-search', 'Prova') +
        '</div>' +
        '<div class="set-note">GattoSearch è il motore incluso: interroga in parallelo l\'indice di Wikipedia e le risposte istantanee di DuckDuckGo e mostra i risultati senza pubblicità.</div>';

    case 'default':
      return '<h3>Browser predefinito</h3>' +
        '<div class="set-card">' +
          uI('Stato', '<span id="defaultState">' + (window.matchMedia('(display-mode: standalone)').matches ? 'installato come app' : 'in esecuzione nel browser') + '</span>') +
          uB('Installa GattoBrowser come app', 'Icona sul desktop o sulla schermata Home', 'install', 'Installa') +
          uB('Diventa il browser predefinito', 'Istruzioni per il tuo sistema operativo', 'default-guide', 'Configura') +
          uB('Registra i link di GattoBrowser', 'Permette ai link “web+gattobrowser:” di aprirsi qui', 'protocol', 'Registra') +
        '</div>' +
        '<div class="set-card">' +
          uB('Windows 10 / 11', 'App predefinite', 'os-win', 'Istruzioni') +
          uB('Linux', 'xdg-settings e file .desktop', 'os-linux', 'Istruzioni') +
          uB('macOS', 'Impostazioni di Sistema', 'os-mac', 'Istruzioni') +
          uB('Android', 'App predefinite e PWA', 'os-android', 'Istruzioni') +
          uB('iPhone / iPad', 'Aggiungi alla schermata Home', 'os-ios', 'Istruzioni') +
          uB('Xbox', 'Edge su Xbox e Preferiti', 'os-xbox', 'Istruzioni') +
          uB('PlayStation 4 / 5', 'Browser della console', 'os-ps', 'Istruzioni') +
        '</div>' +
        '<div class="set-note">Nessun sito web può diventare browser di sistema da solo: serve un\'impostazione del sistema operativo. GattoBrowser ti dà i passaggi esatti e, installato come app, si apre come una finestra dedicata.</div>';

    case 'startup':
      return '<h3>All\'avvio</h3>' +
        '<div class="set-card">' +
          uS('startup', 'Quando apri GattoBrowser', 'Cosa mostrare all\'avvio', [['home', 'Apri la pagina iniziale'], ['restore', 'Continua da dove eri rimasto'], ['links', 'Apri i miei link di avvio']]) +
          uB('Aggiungi un link di avvio', 'Si apre automaticamente all\'avvio', 'startup-add', '＋ Aggiungi') +
          startupRows() +
          uB('Apri adesso i link di avvio', 'Prova la configurazione', 'startup-run', 'Apri') +
        '</div>';

    case 'lang':
      return '<h3>Lingue</h3>' +
        '<div class="set-card">' +
          uI('Lingua dell\'interfaccia', 'Italiano') +
          uS('translateTarget', 'Lingua di traduzione preferita', 'Usata da “Traduci” nel menu', [['it', 'Italiano'], ['en', 'Inglese'], ['es', 'Spagnolo'], ['fr', 'Francese'], ['de', 'Tedesco'], ['ja', 'Giapponese'], ['zh-CN', 'Cinese'], ['ar', 'Arabo']]) +
          uT('translateSites', 'Proponi di tradurre i siti stranieri', 'Mostra un avviso quando il sito non è in italiano') +
          uB('Traduci la pagina corrente', 'Apre Google Translate', 'translate', 'Traduci') +
        '</div>';

    case 'down':
      return '<h3>Download</h3>' +
        '<div class="set-card">' +
          uT('askDownloadLocation', 'Chiedi dove salvare ogni file', 'Usa il selettore file del sistema (dove supportato)') +
          uT('openPdfExternal', 'Apri i PDF nel visualizzatore del sistema', 'Più veloce per i file grandi') +
          uB('Apri i download', S.downloads.length + ' elementi', 'downloads', 'Apri') +
          uB('Svuota l\'elenco', 'Non cancella i file dal disco', 'clear-downloads', 'Svuota') +
        '</div>';

    case 'a11y':
      return '<h3>Accessibilità</h3>' +
        '<div class="set-card">' +
          uS('fontSize', 'Dimensione del testo', 'Interfaccia di GattoBrowser', [['12', 'Piccolo'], ['13', 'Compatto'], ['14', 'Normale'], ['16', 'Grande'], ['18', 'Molto grande']]) +
          uS('zoom', 'Zoom delle pagine', 'Applicato alle schede', [['80', '80%'], ['90', '90%'], ['100', '100%'], ['110', '110%'], ['125', '125%'], ['150', '150%']]) +
          uT('highContrast', 'Contrasto elevato', 'Testi e bordi più marcati') +
          uT('reducedMotion', 'Riduci le animazioni', 'Utile per chi soffre di nausea da movimento') +
          uT('largeCaret', 'Cursore di testo evidenziato', 'Cursore colorato nei campi') +
        '</div>';

    case 'system':
      return '<h3>Sistema</h3>' +
        '<div class="set-card">' +
          uI('Versione', 'GattoBrowser ' + CONFIG.version + ' · di GattoHub') +
          uI('Memoria JS', '<span id="sysMem">' + memEstimate() + '</span>') +
          uI('Schede aperte', String(state.tabs.length)) +
          uI('Modalità', (window.matchMedia('(display-mode: standalone)').matches ? 'app installata' : 'scheda del browser')) +
          '<div class="set-row vertical"><div class="txt"><b>User agent</b><small>' + esc(navigator.userAgent) + '</small></div></div>' +
          uB('Cancella la cache dell\'app', 'Forza il download della versione più recente', 'cache', 'Cancella') +
          uB('Segnala un problema', 'Apri una issue su GitHub', 'issues', 'GitHub') +
          uB('Informazioni su GattoBrowser', 'A cosa serve e come funziona', 'about', 'Info') +
          uB('Ripristina tutte le impostazioni', 'Azione irreversibile', 'resetall', 'Reset') +
        '</div>';
    default:
      return '<h3>Sezione</h3>';
  }
}

function buildSettings(tab) {
  const pane = tab.pane;
  pane.innerHTML =
    '<div class="settings" id="settingsRoot">' +
      '<aside class="set-side">' +
        '<div class="title">' + LOGO_SVG + ' Impostazioni</div>' +
        SETTINGS_SECTIONS.map((s, i) => '<button data-act="set-section" data-sec="' + s.id + '" class="' + (i === 0 ? 'active' : '') + '"><span class="ico">' + s.icon + '</span>' + esc(s.label) + '</button>').join('') +
      '</aside>' +
      '<div class="set-main">' +
        '<div class="set-searchbar"><input id="setSearch" placeholder="Cerca nelle impostazioni" aria-label="Cerca nelle impostazioni"></div>' +
        SETTINGS_SECTIONS.map((s, i) => '<section class="set-sec ' + (i === 0 ? 'active' : '') + '" data-sec="' + s.id + '">' + settingsSectionHTML(s.id) + '</section>').join('') +
      '</div>' +
    '</div>';
  const search = $('#setSearch', pane);
  if (search) search.addEventListener('input', () => filterSettings(search.value));
}

function setSettingsSection(id) {
  const root = $('.settings');
  if (!root) return;
  const target = $('.set-sec[data-sec="' + id + '"]', root);
  if (!target) return;
  root.classList.remove('searching');
  $$('.set-side button', root).forEach((b) => b.classList.toggle('active', b.dataset.sec === id));
  $$('.set-sec', root).forEach((s) => s.classList.toggle('active', s.dataset.sec === id));
  const search = $('#setSearch', root);
  if (search) search.value = '';
  $('.set-main', root).scrollTop = 0;
}

function filterSettings(q) {
  const root = $('.settings');
  if (!root) return;
  const query = String(q || '').trim().toLowerCase();
  root.classList.toggle('searching', !!query);
  if (!query) {
    $$('.set-sec', root).forEach((s) => s.classList.remove('match'));
    const active = $('.set-side button.active', root);
    if (active) setSettingsSection(active.dataset.sec);
    return;
  }
  $$('.set-sec', root).forEach((sec) => {
    let hits = 0;
    $$('.set-row', sec).forEach((row) => {
      const match = row.textContent.toLowerCase().includes(query);
      row.style.display = match ? '' : 'none';
      if (match) hits++;
    });
    sec.classList.toggle('match', hits > 0);
  });
}

function onSettingChanged(key, val) {
  if (key === 'memorySaver' || key === 'memorySaverMinutes') { /* usato dal tick */ }
  if (key === 'savingsMode' && val) { S.animations = false; S.memorySaver = true; save(); applySettings(); }
  if (key === 'savingsMode' && !val) { S.animations = true; save(); applySettings(); }
  if (key === 'guard' || key === 'guardLevel') {
    toast(S.guard ? 'GattoGuard attivo (livello ' + S.guardLevel + ')' : 'GattoGuard disattivato', S.guard ? 'ok' : 'err');
    applySettings();
  }
  if (key === 'theme' || key === 'accent' || key === 'fontSize' || key === 'animations' || key === 'highContrast' || key === 'reducedMotion' || key === 'largeCaret') applySettings();
  if (key === 'zoom') setZoom(Number(S.zoom), true);
  if (key === 'showBookmarksBar') applySettings();
  if (key === 'homeBg') {
    state.tabs.filter((t) => t.kind === 'home').forEach((t) => refreshTab(t));
  }
}

/* ------------------- azioni richiamate dalle impostazioni ------------------- */
function runSettingAction(name, el) {
  switch (name) {
    case 'profile': return profileModal();
    case 'hub': return window.open(CONFIG.hub, '_blank', 'noopener');
    case 'ai-open': return window.open(S.aiTarget || CONFIG.chat, '_blank', 'noopener');
    case 'export': return exportSettings();
    case 'import': return importSettings();
    case 'resetall': return resetAllModal();
    case 'identity-add': return identityModal();
    case 'identity-del': {
      S.savedIdentities.splice(Number(el.dataset.i), 1); save();
      return refreshSettingsPane();
    }
    case 'extensions': return extensionsModal();
    case 'clear': return clearDataModal();
    case 'guard-test': return guardTestModal();
    case 'suspend': {
      let n = 0;
      state.tabs.forEach((t) => { if (t.kind === 'web' && t.id !== state.active && t.frame) { suspendTab(t); n++; } });
      return toast(n + ' schede sospese per liberare RAM', 'ok');
    }
    case 'shot': return takeScreenshot();
    case 'bg-edit': return bgEditModal();
    case 'links-manage': return homeLinksManager();
    case 'newtab': return createTab('home');
    case 'try-search': {
      const tab = createTab('search', { query: 'GattoHub giochi browser', title: 'GattoSearch: prova' });
      return tab;
    }
    case 'install': return installPwa();
    case 'default-guide': return defaultBrowserModal();
    case 'protocol': return registerProtocol();
    case 'os-win': return osGuide('win');
    case 'os-linux': return osGuide('linux');
    case 'os-mac': return osGuide('mac');
    case 'os-android': return osGuide('android');
    case 'os-ios': return osGuide('ios');
    case 'os-xbox': return osGuide('xbox');
    case 'os-ps': return osGuide('ps');
    case 'startup-add': return startupLinkModal();
    case 'startup-del': {
      S.startupLinks.splice(Number(el.dataset.i), 1); save();
      return refreshSettingsPane();
    }
    case 'startup-run': {
      if (!S.startupLinks.length) return toast('Aggiungi prima un link di avvio', 'err');
      S.startupLinks.forEach((u) => openUrl(u, { newTab: true }));
      return toast('Link di avvio aperti', 'ok');
    }
    case 'downloads': return ACTIONS['open-page']({ dataset: { page: 'downloads' } }, { preventDefault() {} });
    case 'clear-downloads': S.downloads = []; save(); return refreshSettingsPane();
    case 'cache': return clearAppCache();
    case 'issues': return window.open(CONFIG.issues, '_blank', 'noopener');
    case 'about': return aboutModal();
    case 'groups': return groupsModal();
    case 'list-add': return listModal();
    case 'translate': return translateModal();
    default: return toast('Azione non disponibile');
  }
}

function refreshSettingsPane() {
  const st = state.tabs.find((t) => t.kind === 'settings');
  if (!st) return;
  const activeSec = $('.set-sec.active');
  const sec = activeSec ? activeSec.dataset.sec : 'account';
  refreshTab(st);
  setTimeout(() => setSettingsSection(sec), 20);
}

function profileModal() {
  const back = openModal('Personalizza il profilo',
    '<label class="field">Nome<input id="pmName" value="' + esc(S.profileName) + '"></label>' +
    '<label class="field">Email<input id="pmMail" value="' + esc(S.profileEmail) + '"></label>' +
    '<div class="set-note">Il profilo è locale: serve solo a personalizzare menu e pagina iniziale.</div>',
    '<button class="btn" data-close>Annulla</button><button class="btn primary js-save">Salva</button>');
  back.querySelector('.js-save').onclick = () => {
    S.profileName = back.querySelector('#pmName').value.trim() || 'Gatto';
    S.profileEmail = back.querySelector('#pmMail').value.trim();
    save(); applySettings(); refreshSettingsPane(); back.remove(); toast('Profilo aggiornato', 'ok');
  };
}

function identityModal() {
  const back = openModal('Aggiungi profilo di compilazione',
    '<label class="field">Nome<input id="idName" placeholder="Francy Panda"></label>' +
    '<label class="field">Email<input id="idMail" placeholder="nome@email.it"></label>' +
    '<label class="field">Indirizzo (opzionale)<input id="idAddr" placeholder="Via, città"></label>',
    '<button class="btn" data-close>Annulla</button><button class="btn primary js-save">Salva</button>');
  back.querySelector('.js-save').onclick = () => {
    const name = back.querySelector('#idName').value.trim();
    const email = back.querySelector('#idMail').value.trim();
    if (!name || !email) return toast('Nome ed email sono obbligatori', 'err');
    S.savedIdentities.push({ name, email, address: back.querySelector('#idAddr').value.trim() });
    save(); back.remove(); refreshSettingsPane(); toast('Profilo salvato', 'ok');
  };
}

function exportSettings() {
  const data = JSON.stringify(S, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  downloadBlob(blob, 'gattobrowser-impostazioni.json');
}
function importSettings() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'application/json';
  input.onchange = async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      S = deepMerge(cloneSettings(DEFAULT_SETTINGS), parsed);
      save(); applySettings(); refreshSettingsPane();
      toast('Impostazioni importate', 'ok');
    } catch (e) { toast('File non valido', 'err'); }
  };
  input.click();
}

function resetAllModal() {
  const back = openModal('Ripristinare tutto?',
    '<p>Verranno cancellati preferiti, cronologia, download, collegamenti, sfondo e impostazioni. <b>L\'operazione non si può annullare.</b></p>',
    '<button class="btn" data-close>Annulla</button><button class="btn danger js-go">Ripristina</button>');
  back.querySelector('.js-go').onclick = async () => {
    try { await idbDel('homebg'); } catch (e) { /* noop */ }
    localStorage.removeItem(LS_KEY); localStorage.removeItem(SESSION_KEY);
    S = cloneSettings(DEFAULT_SETTINGS);
    save(); applySettings(); back.remove();
    state.tabs.slice().forEach((t) => { if (t.pane) t.pane.remove(); });
    state.tabs = []; state.seq = 1; state.active = null;
    createTab('home');
    toast('GattoBrowser ripristinato', 'ok');
  };
}

function extensionsModal() {
  const ext = S.extensions;
  const rows = [
    ['guard', '🛡 GattoGuard', 'Scansione URL e blocco delle pagine rischiose'],
    ['popups', '🚫 Blocco pop-up', 'Impedisce l\'apertura automatica di finestre'],
    ['dark', '🌙 Tema scuro per i siti', 'Inverte i colori delle pagine incorporate'],
    ['quicknote', '📝 Note rapide', 'Salva appunti nella pagina iniziale'],
    ['ai', '✨ Screenshot → AI', 'Pulsante di invio verso la chat AI'],
    ['reader', '📖 Modalità lettura', 'Riduce il rumore visivo delle pagine interne']
  ];
  const back = openModal('🧩 Estensioni integrate',
    '<p>GattoBrowser include estensioni già attive: nessun download, nessun permesso extra.</p>' +
    rows.map((r) =>
      '<div class="checkline"><button class="switch" role="switch" aria-checked="' + (!!ext[r[0]]) + '" data-ext="' + r[0] + '"></button>' +
      '<div style="flex:1"><b>' + r[1] + '</b><div style="color:var(--muted);font-size:11.5px">' + r[2] + '</div></div></div>'
    ).join(''),
    '<button class="btn primary" data-close>Fatto</button>');
  back.querySelectorAll('[data-ext]').forEach((sw) => {
    sw.onclick = () => {
      const key = sw.dataset.ext;
      S.extensions[key] = !S.extensions[key];
      sw.setAttribute('aria-checked', String(S.extensions[key]));
      if (key === 'guard') S.guard = S.extensions.guard;
      save(); applySettings();
    };
  });
}

function clearDataModal() {
  const back = openModal('Elimina dati di navigazione',
    '<div class="checkline"><input type="checkbox" id="cdHist" checked><label for="cdHist">Cronologia</label></div>' +
    '<div class="checkline"><input type="checkbox" id="cdDown" checked><label for="cdDown">Elenco download</label></div>' +
    '<div class="checkline"><input type="checkbox" id="cdBm"><label for="cdBm">Preferiti</label></div>' +
    '<div class="checkline"><input type="checkbox" id="cdLinks"><label for="cdLinks">Collegamenti della home</label></div>' +
    '<div class="checkline"><input type="checkbox" id="cdCache"><label for="cdCache">Cache dell\'app</label></div>' +
    '<div class="set-note">I file già scaricati sul disco non vengono toccati.</div>',
    '<button class="btn" data-close>Annulla</button><button class="btn danger js-go">Elimina</button>');
  back.querySelector('.js-go').onclick = async () => {
    if (back.querySelector('#cdHist').checked) S.history = [];
    if (back.querySelector('#cdDown').checked) S.downloads = [];
    if (back.querySelector('#cdBm').checked) S.bookmarks = [];
    if (back.querySelector('#cdLinks').checked) S.homeLinks = [];
    save(); applySettings();
    if (back.querySelector('#cdCache').checked) await clearAppCache(true);
    back.remove();
    refreshSettingsPane();
    const t = activeTab();
    if (t && ['history', 'downloads', 'bookmarks'].includes(t.kind)) refreshTab(t);
    toast('Dati eliminati', 'ok');
  };
}

function guardTestModal() {
  const back = openModal('Verifica un indirizzo',
    '<label class="field">URL da controllare<input id="gtUrl" placeholder="https://esempio.it"></label>' +
    '<div id="gtOut" class="set-note">GattoGuard analizzerà l\'indirizzo senza aprirlo.</div>',
    '<button class="btn" data-close>Chiudi</button><button class="btn primary js-go">Analizza</button>');
  back.querySelector('.js-go').onclick = () => {
    const url = normalizeUrl(back.querySelector('#gtUrl').value);
    const g = guardCheck(url);
    back.querySelector('#gtOut').innerHTML = '<b>' + (g.ok ? '✅ Nessun rischio rilevante' : '⛔ Bloccato') + '</b> · punteggio ' + g.score +
      (g.reasons.length ? '<br>' + g.reasons.map(esc).join('<br>') : '<br>Nessuna anomalia trovata.');
  };
}

function bgEditModal() {
  const back = openModal('Sfondo della pagina iniziale',
    '<p>Usa una foto, un video o una sfumatura. I file restano sul tuo dispositivo.</p>' +
    '<div class="row"><input type="file" id="bgFile" accept="image/*,video/*" class="mini" style="flex:1"></div>' +
    '<label class="field">…oppure un link a immagine o video<input id="bgUrl" placeholder="https://…/sfondo.jpg" value="' + esc(S.homeBg.type === 'url' ? S.homeBg.value : '') + '"></label>' +
    '<div class="set-note">Formati supportati: JPG, PNG, WebP, GIF, MP4, WebM. Video muto in loop automatico.</div>',
    '<button class="btn danger js-clear">Rimuovi sfondo</button><button class="btn" data-close>Chiudi</button><button class="btn primary js-save">Applica</button>');
  back.querySelector('.js-save').onclick = async () => {
    const fileInput = back.querySelector('#bgFile');
    const url = back.querySelector('#bgUrl').value.trim();
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      try {
        await idbPut('homebg', file);
        if (S._bgObjectUrl) URL.revokeObjectURL(S._bgObjectUrl);
        S._bgObjectUrl = URL.createObjectURL(file);
        S.homeBg = { type: 'file', value: file.name, mime: file.type };
      } catch (e) { toast('Impossibile salvare il file (troppo grande?)', 'err'); return; }
    } else if (url) {
      S.homeBg = { type: 'url', value: url };
    } else {
      toast('Scegli un file o inserisci un link', 'err'); return;
    }
    save(); back.remove(); refreshSettingsPane();
    state.tabs.filter((t) => t.kind === 'home').forEach((t) => refreshTab(t));
    toast('Sfondo aggiornato', 'ok');
  };
  back.querySelector('.js-clear').onclick = async () => {
    S.homeBg = { type: 'gradient', value: '' };
    if (S._bgObjectUrl) { URL.revokeObjectURL(S._bgObjectUrl); S._bgObjectUrl = null; }
    try { await idbDel('homebg'); } catch (e) { /* noop */ }
    save(); back.remove(); refreshSettingsPane();
    state.tabs.filter((t) => t.kind === 'home').forEach((t) => refreshTab(t));
    toast('Sfondo rimosso');
  };
}

function homeLinkModal() {
  const back = openModal('Aggiungi un collegamento',
    '<label class="field">Nome<input id="hlName" placeholder="GattoHub"></label>' +
    '<label class="field">Indirizzo<input id="hlUrl" placeholder="https://gattoita-lab.github.io/GattoHub/"></label>',
    '<button class="btn" data-close>Annulla</button><button class="btn primary js-save">Aggiungi</button>');
  back.querySelector('.js-save').onclick = () => {
    const title = back.querySelector('#hlName').value.trim();
    const url = normalizeUrl(back.querySelector('#hlUrl').value.trim());
    if (!title || !url) return toast('Compila nome e indirizzo', 'err');
    S.homeLinks.push({ title, url });
    save(); back.remove();
    state.tabs.filter((t) => t.kind === 'home').forEach((t) => refreshTab(t));
    toast('Collegamento aggiunto', 'ok');
  };
}

function homeLinksManager() {
  const rows = S.homeLinks.map((l, i) =>
    '<div class="list-item"><span class="ico">' + esc(favLetter(l.title)) + '</span><div class="main"><b>' + esc(l.title) + '</b><small>' + esc(l.url) + '</small></div>' +
    '<button class="x" data-i="' + i + '">✕</button></div>'
  ).join('') || '<div class="empty-state">Nessun collegamento.</div>';
  const back = openModal('Collegamenti della pagina iniziale',
    '<div class="list" id="hlList">' + rows + '</div>' +
    '<div class="row"><input class="mini" id="hlNewName" placeholder="Nome" style="flex:1"><input class="mini" id="hlNewUrl" placeholder="https://…" style="flex:2"><button class="btn primary" id="hlAdd">＋</button></div>',
    '<button class="btn primary" data-close>Fatto</button>');
  const list = back.querySelector('#hlList');
  list.querySelectorAll('button[data-i]').forEach((btn) => {
    btn.onclick = () => {
      S.homeLinks.splice(Number(btn.dataset.i), 1); save();
      btn.closest('.list-item').remove();
      state.tabs.filter((t) => t.kind === 'home').forEach((t) => refreshTab(t));
    };
  });
  back.querySelector('#hlAdd').onclick = () => {
    const name = back.querySelector('#hlNewName').value.trim();
    const url = normalizeUrl(back.querySelector('#hlNewUrl').value.trim());
    if (!name || !url) return toast('Nome e URL obbligatori', 'err');
    S.homeLinks.push({ title: name, url }); save();
    back.remove(); homeLinksManager();
    state.tabs.filter((t) => t.kind === 'home').forEach((t) => refreshTab(t));
  };
}

/* -------------------- browser predefinito / guide -------------------- */
function osGuide(os) {
  const guides = {
    win: {
      title: 'Windows 10 / 11',
      body: '<ol style="line-height:1.8;padding-left:18px">' +
        '<li>Installa GattoBrowser come app (pulsante “Installa”).</li>' +
        '<li>Apri <b>Impostazioni → App → App predefinite</b>.</li>' +
        '<li>Alla voce “Browser web” scegli <b>GattoBrowser</b> (o l\'app con cui lo hai installato).</li>' +
        '<li>Se non compare, usa “Scegli un\'app predefinita per tipo di file” e seleziona GattoBrowser per HTTP/HTTPS.</li></ol>' +
        '<div class="set-note">Nota: Windows accetta solo app installate come programmi. Per questo GattoBrowser si installa come PWA (icona e finestra dedicata).</div>'
    },
    linux: {
      title: 'Linux',
      body: '<p>Crea il file <b>~/.local/share/applications/gattobrowser.desktop</b>:</p>' +
        '<div class="code">[Desktop Entry]\nName=GattoBrowser\nExec=xdg-open ' + esc(location.origin + location.pathname) + '\nType=Application\nCategories=Network;WebBrowser;\nMimeType=x-scheme-handler/http;x-scheme-handler/https;</div>' +
        '<p>Poi imposta il predefinito:</p>' +
        '<div class="code">xdg-settings set default-web-browser gattobrowser.desktop\nxdg-mime default gattobrowser.desktop x-scheme-handler/https</div>' +
        '<p>Con Chrome/Chromium installato puoi anche lanciarlo in modalità app:</p>' +
        '<div class="code">google-chrome --app=' + esc(location.origin + location.pathname) + '</div>'
    },
    mac: {
      title: 'macOS',
      body: '<ol style="line-height:1.8;padding-left:18px">' +
        '<li>Installa GattoBrowser come app (Safari: Condividi → Aggiungi al Dock).</li>' +
        '<li>Apri <b>Impostazioni di Sistema → Desktop e Dock</b>.</li>' +
        '<li>Alla voce “Browser web predefinito” scegli GattoBrowser (o l\'app che lo ospita).</li></ol>' +
        '<div class="code">open -a "Google Chrome" --args --app=' + esc(location.origin + location.pathname) + '</div>'
    },
    android: {
      title: 'Android',
      body: '<ol style="line-height:1.8;padding-left:18px">' +
        '<li>Apri GattoBrowser in Chrome e tocca <b>Installa app</b> (o menu ⋮ → Aggiungi a schermata Home).</li>' +
        '<li>Impostazioni → App → App predefinite → Browser → scegli GattoBrowser.</li>' +
        '<li>Se non appare, imposta come predefinito il browser che ospita la PWA e apri GattoBrowser dall\'icona.</li></ol>'
    },
    ios: {
      title: 'iPhone / iPad',
      body: '<ol style="line-height:1.8;padding-left:18px">' +
        '<li>Apri GattoBrowser in Safari.</li>' +
        '<li>Tocca <b>Condividi → Aggiungi alla schermata Home</b>.</li>' +
        '<li>Apri l\'icona: GattoBrowser parte a schermo intero, come un\'app.</li></ol>' +
        '<div class="set-note">iOS non permette di cambiare browser predefinito per le app di sistema: la PWA è il modo migliore per avere GattoBrowser sempre a portata di mano.</div>'
    },
    xbox: {
      title: 'Xbox',
      body: '<ol style="line-height:1.8;padding-left:18px">' +
        '<li>Apri <b>Microsoft Edge</b> sulla console.</li>' +
        '<li>Vai su <b>' + esc(location.origin + location.pathname) + '</b>.</li>' +
        '<li>Menu Edge → <b>Preferiti</b> → Aggiungi ai preferiti (o “Aggiungi a Start”).</li>' +
        '<li>Per la ricerca usa la barra degli indirizzi di GattoBrowser con il gamepad o la tastiera virtuale.</li></ol>' +
        '<div class="set-note">Xbox non supporta browser predefiniti personalizzati: il collegamento a Start è il massimo supportato dal sistema.</div>'
    },
    ps: {
      title: 'PlayStation 4 / 5',
      body: '<ol style="line-height:1.8;padding-left:18px">' +
        '<li>Apri il browser dalla sezione <b>Notizie/Guida</b> della console.</li>' +
        '<li>Digita <b>' + esc(location.origin + location.pathname) + '</b> (o il link breve dalla pagina di download).</li>' +
        '<li>Salva la pagina nei Preferiti del browser PlayStation.</li></ol>' +
        '<div class="set-note">Il browser PlayStation non permette di impostare un browser predefinito: usa il bookmark per riaprirlo in un tocco.</div>'
    }
  };
  const g = guides[os] || guides.win;
  const body = '<h4 style="margin:0;color:var(--txt)">' + esc(g.title) + '</h4>' + g.body +
    '<div class="set-note">URL di GattoBrowser: <span class="code" style="display:inline-block;margin-top:6px">' + esc(location.origin + location.pathname) + '</span></div>';
  const back = openModal('Imposta GattoBrowser su ' + g.title, body,
    '<button class="btn" data-close>Chiudi</button><button class="btn primary js-copy">Copia URL</button>');
  back.querySelector('.js-copy').onclick = () => {
    navigator.clipboard.writeText(location.origin + location.pathname).then(() => toast('URL copiato', 'ok')).catch(() => toast('Copia non riuscita', 'err'));
  };
}

function defaultBrowserModal() {
  const back = openModal('GattoBrowser come browser predefinito',
    '<p>I siti web non possono modificare da soli il browser di sistema: serve un passaggio nelle impostazioni. Ecco come fare in 30 secondi.</p>' +
    '<div class="checkline">1️⃣ Installa GattoBrowser come app → compare tra le applicazioni del sistema.</div>' +
    '<div class="checkline">2️⃣ Apri le impostazioni del browser predefinito del tuo sistema.</div>' +
    '<div class="checkline">3️⃣ Scegli GattoBrowser per i link HTTP e HTTPS.</div>' +
    '<div class="set-note">GattoBrowser usa il motore del sistema: quando diventa predefinito, i link si aprono nella sua interfaccia con GattoSearch, GattoGuard e lo screenshot verso l\'AI.</div>' +
    '<div class="row">' +
      '<button class="btn" data-os="win">Windows</button><button class="btn" data-os="linux">Linux</button><button class="btn" data-os="mac">macOS</button>' +
      '<button class="btn" data-os="android">Android</button><button class="btn" data-os="ios">iPhone/iPad</button>' +
      '<button class="btn" data-os="xbox">Xbox</button><button class="btn" data-os="ps">PlayStation</button>' +
    '</div>',
    '<button class="btn" data-close>Chiudi</button><button class="btn primary js-install">Installa come app</button>');
  back.querySelectorAll('[data-os]').forEach((b) => b.onclick = () => { back.remove(); osGuide(b.dataset.os); });
  back.querySelector('.js-install').onclick = () => { back.remove(); installPwa(); };
}

function registerProtocol() {
  const url = location.origin + location.pathname + '?url=%s';
  try {
    if (!navigator.registerProtocolHandler) return toast('Il browser non supporta la registrazione dei protocolli', 'err');
    navigator.registerProtocolHandler('web+gattobrowser', url);
    toast('Protocollo web+gattobrowser registrato', 'ok');
  } catch (e) {
    toast('Registrazione non consentita: ' + e.message, 'err', 4500);
  }
}

/* ------------------------------- about ------------------------------- */
function aboutModal() {
  openModal('🐱 Informazioni su GattoBrowser',
    '<p><b>GattoBrowser ' + CONFIG.version + '</b> è il browser leggero di GattoHub: interfaccia a schede, GattoSearch con indice libero, GattoGuard, screenshot verso la chat AI, pagina iniziale personalizzabile e notizie da Google News.</p>' +
    '<p>Usa il motore del sistema (Chromium/WebKit/Gecko) e aggiunge solo l\'interfaccia: nessun download di 500 MB, nessun processo in background.</p>' +
    '<div class="set-note">Funziona su Windows, Linux, macOS, Android, iPhone, iPad, Xbox e PlayStation: dove c\'è un browser, c\'è GattoBrowser.</div>' +
    '<p style="margin:0"><a href="' + CONFIG.hub + '" data-act="open-url" data-url="' + CONFIG.hub + '">GattoHub</a> · <a href="' + CONFIG.repo + '" data-act="open-external" data-url="' + CONFIG.repo + '">Repository GitHub</a></p>',
    '<button class="btn primary" data-close>Chiudi</button>');
}

function groupsModal() {
  const rows = S.groups.map((g, i) =>
    '<div class="list-item"><span class="ico">🗂</span><div class="main"><b>' + esc(g.name) + '</b><small>' + g.tabs.length + ' schede · ' + esc(fmtTime(g.date)) + '</small></div>' +
    '<button class="btn sm" data-restore="' + i + '">Apri</button><button class="x" data-del="' + i + '">✕</button></div>'
  ).join('') || '<div class="empty-state">Nessun gruppo salvato.</div>';
  const back = openModal('🗂 Gruppi di schede',
    '<p>Salva le schede aperte come gruppo e riaprili quando vuoi.</p>' +
    '<div class="list">' + rows + '</div>' +
    '<label class="field">Nome del nuovo gruppo<input id="grpName" placeholder="Ricerca di oggi"></label>',
    '<button class="btn" data-close>Chiudi</button><button class="btn primary js-save">Salva schede attuali</button>');
  back.querySelector('.js-save').onclick = () => {
    const name = back.querySelector('#grpName').value.trim() || 'Gruppo ' + (S.groups.length + 1);
    const tabs = state.tabs.filter((t) => t.url).map((t) => ({ url: t.url, title: t.title }));
    if (!tabs.length) return toast('Nessuna scheda con un indirizzo da salvare', 'err');
    S.groups.unshift({ name, tabs, date: Date.now() });
    save(); back.remove(); groupsModal(); toast('Gruppo salvato', 'ok');
  };
  back.querySelectorAll('[data-restore]').forEach((b) => b.onclick = () => {
    const g = S.groups[Number(b.dataset.restore)];
    g.tabs.forEach((t) => openUrl(t.url, { newTab: true }));
    back.remove(); toast('Gruppo riaperto', 'ok');
  });
  back.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => {
    S.groups.splice(Number(b.dataset.del), 1); save(); b.closest('.list-item').remove();
  });
}

function listModal() {
  const back = openModal('Nuovo elenco di lettura',
    '<label class="field">Nome dell\'elenco<input id="lsName" placeholder="Da leggere stasera"></label>' +
    '<div class="set-note">Potrai aggiungere la pagina corrente dal menu dei preferiti.</div>',
    '<button class="btn" data-close>Annulla</button><button class="btn primary js-save">Crea</button>');
  back.querySelector('.js-save').onclick = () => {
    const name = back.querySelector('#lsName').value.trim();
    if (!name) return toast('Dai un nome all\'elenco', 'err');
    const tab = activeTab();
    S.lists.push({ title: name, items: tab && tab.url ? [{ title: tab.title, url: tab.url }] : [] });
    save(); back.remove(); refreshSettingsPane(); toast('Elenco creato', 'ok');
  };
}

function startupLinkModal() {
  const back = openModal('Link di avvio',
    '<label class="field">Indirizzo da aprire all\'avvio<input id="slUrl" placeholder="https://gattoita-lab.github.io/GattoHub/"></label>',
    '<button class="btn" data-close>Annulla</button><button class="btn primary js-save">Aggiungi</button>');
  back.querySelector('.js-save').onclick = () => {
    const url = normalizeUrl(back.querySelector('#slUrl').value.trim());
    if (!url) return toast('Inserisci un indirizzo', 'err');
    S.startupLinks.push(url); save(); back.remove(); refreshSettingsPane();
  };
}

async function clearAppCache(silent) {
  try {
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if (!silent) toast('Cache dell\'app cancellata: ricarica per aggiornare', 'ok');
  } catch (e) { if (!silent) toast('Impossibile cancellare la cache', 'err'); }
}
