'use strict';
/* GattoBrowser — landing: rilevamento sistema, download avvio, installazione PWA */

(function () {
  var browserUrl = new URL('browser.html', location.href).href;
  var siteUrl = new URL('.', location.href).href;

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function detectOS() {
    var ua = navigator.userAgent;
    if (/Xbox/i.test(ua)) return 'xbox';
    if (/PlayStation/i.test(ua)) return 'ps';
    if (/android/i.test(ua)) return 'android';
    if (/iPad/i.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)) return 'ipad';
    if (/iPhone|iPod/.test(ua)) return 'iphone';
    if (/Windows/i.test(ua)) return 'win';
    if (/Mac/i.test(ua)) return 'mac';
    if (/Linux/i.test(ua)) return 'linux';
    return 'win';
  }

  var osNames = {
    win: 'Windows', linux: 'Linux', mac: 'macOS', android: 'Android',
    iphone: 'iPhone', ipad: 'iPad', xbox: 'Xbox', ps: 'PlayStation'
  };

  var currentOS = detectOS();
  var detected = document.getElementById('detected');
  if (detected) {
    detected.textContent = 'Sistema rilevato: ' + (osNames[currentOS] || currentOS) + ' · GattoBrowser è pronto.';
  }
  Array.prototype.forEach.call(document.querySelectorAll('.dl-card'), function (card) {
    if (card.dataset.os === currentOS || (currentOS === 'ipad' && card.dataset.os === 'ipad')) card.classList.add('hot');
  });

  var mainBtn = document.getElementById('mainDownload');
  if (mainBtn) {
    mainBtn.textContent = currentOS === 'win' ? 'Scarica per Windows'
      : currentOS === 'linux' ? 'Scarica per Linux'
      : currentOS === 'mac' ? 'Scarica per macOS'
      : currentOS === 'android' ? 'Installa su Android'
      : currentOS === 'iphone' || currentOS === 'ipad' ? 'Installa su ' + osNames[currentOS]
      : 'Come usarlo su ' + (osNames[currentOS] || '');
    mainBtn.addEventListener('click', function (e) {
      if (['win', 'linux', 'mac', 'android'].indexOf(currentOS) >= 0) {
        e.preventDefault();
        handleDownload(currentOS);
      }
    });
  }

  function launcher(kind) {
    if (kind === 'win') {
      return {
        name: 'GattoBrowser-Windows.bat',
        text: '@echo off\r\ntitle GattoBrowser\r\nset "URL=' + browserUrl + '"\r\n' +
          'where msedge >nul 2>nul\r\nif %errorlevel%==0 (start "" msedge --app="%URL%" & exit /b)\r\n' +
          'where chrome >nul 2>nul\r\nif %errorlevel%==0 (start "" chrome --app="%URL%" & exit /b)\r\n' +
          'start "" "%URL%"\r\n'
      };
    }
    if (kind === 'linux') {
      return {
        name: 'gattobrowser.sh',
        text: '#!/bin/sh\n# GattoBrowser — avvio in finestra dedicata\nURL="' + browserUrl + '"\n' +
          'for b in google-chrome chromium chromium-browser microsoft-edge brave-browser vivaldi; do\n' +
          '  if command -v "$b" >/dev/null 2>&1; then exec "$b" --app="$URL"; fi\n' +
          'done\nxdg-open "$URL"\n'
      };
    }
    return {
      name: 'GattoBrowser-macOS.command',
      text: '#!/bin/zsh\nURL="' + browserUrl + '"\n' +
        'open -na "Google Chrome" --args --app="$URL" 2>/dev/null && exit 0\n' +
        'open -na "Microsoft Edge" --args --app="$URL" 2>/dev/null && exit 0\n' +
        'open "$URL"\n'
    };
  }

  function download(file) {
    var blob = new Blob([file.text], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    var url = URL.createObjectURL(blob);
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 6000);
  }

  function showModal(html) {
    var m = document.getElementById('lmodal');
    document.getElementById('lmodalBody').innerHTML = html;
    m.classList.remove('hidden');
  }
  var lm = document.getElementById('lmodal');
  if (lm) {
    lm.addEventListener('click', function (e) { if (e.target === lm) lm.classList.add('hidden'); });
    var x = document.getElementById('lmodalX');
    if (x) x.onclick = function () { lm.classList.add('hidden'); };
  }

  var guides = {
    android: {
      title: 'Installa GattoBrowser su Android',
      body: '<ol><li>Se Chrome/Edge lo consente, tocca “Installa app” nella barra o nel menu ⋮ → <b>Installa app</b>.</li>' +
        '<li>In alternativa: menu ⋮ → <b>Aggiungi a schermata Home</b>.</li>' +
        '<li>Per renderlo browser predefinito: Impostazioni Android → App → App predefinite → Browser.</li>' +
        '<li>Apri GattoBrowser dall\'icona: parte a schermo intero, senza barre del browser.</li></ol>'
    },
    ios: {
      title: 'Installa GattoBrowser su iPhone / iPad',
      body: '<ol><li>Apri GattoBrowser in Safari.</li><li>Tocca <b>Condividi</b> (quadrato con freccia).</li>' +
        '<li>Scegli <b>Aggiungi alla schermata Home</b> e conferma.</li>' +
        '<li>Aprila dall\'icona: GattoBrowser si apre a schermo intero come un\'app.</li></ol>' +
        '<p>iOS non permette di scegliere un browser predefinito diverso da Safari per le app di sistema: la PWA è il modo più comodo per avere GattoBrowser sempre pronto.</p>'
    },
    xbox: {
      title: 'Usa GattoBrowser su Xbox',
      body: '<ol><li>Apri <b>Microsoft Edge</b> sulla console.</li>' +
        '<li>Vai su <b>' + esc(siteUrl) + '</b> e poi “Apri il browser”.</li>' +
        '<li>Menu Edge → <b>Preferiti</b> → aggiungi la pagina.</li>' +
        '<li>Puoi anche aggiungerla a Start: menu Edge → Aggiungi a Start.</li></ol>' +
        '<p>Xbox non supporta browser predefiniti personalizzati: il preferito (o la tile su Start) è il massimo supportato dal sistema.</p>'
    },
    ps: {
      title: 'Usa GattoBrowser su PlayStation',
      body: '<ol><li>Avvia la console e apri il browser dalla sezione <b>Notizie/Guida</b>.</li>' +
        '<li>Digita <b>' + esc(siteUrl) + '</b> e conferma.</li>' +
        '<li>Salva la pagina nei <b>Preferiti</b> del browser PlayStation.</li>' +
        '<li>Apri “Apri il browser” e usa GattoBrowser con il controller.</li></ol>' +
        '<p>Il browser PlayStation non permette di impostare un browser predefinito: il bookmark è il modo più rapido per riaprirlo.</p>'
    },
    protocol: {
      title: 'Apri come applicazione',
      body: '<p>Per una finestra senza barre del browser puoi usare l\'avvio scaricato, oppure aprire GattoBrowser con il comando indicato:</p>' +
        '<div class="code">google-chrome --app=' + esc(browserUrl) + '</div>' +
        '<div class="code">msedge --app=' + esc(browserUrl) + '</div>' +
        '<p>Il parametro <b>--app</b> è supportato da Chrome, Edge, Chromium, Brave e Vivaldi su tutte le piattaforme desktop.</p>'
    }
  };

  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
  });

  function handleDownload(kind) {
    if (kind === 'android') {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt = null;
      } else {
        showModal('<h3>' + guides.android.title + '</h3>' + guides.android.body +
          '<a class="btn primary" href="' + browserUrl + '">Apri GattoBrowser</a>');
      }
      return;
    }
    if (guides[kind]) {
      showModal('<h3>' + guides[kind].title + '</h3>' + guides[kind].body +
        '<a class="btn primary" href="' + browserUrl + '">Apri GattoBrowser</a>');
      return;
    }
    var file = launcher(kind);
    download(file);
    var hint = kind === 'linux'
      ? 'Scaricato ' + file.name + '. Nel terminale: chmod +x ' + file.name + ' && ./' + file.name
      : kind === 'mac'
      ? 'Scaricato ' + file.name + ': doppio clic (al primo avvio potresti dover consentire l\'esecuzione).'
      : 'Scaricato ' + file.name + ': doppio clic per aprire GattoBrowser in una finestra dedicata.';
    showModal('<h3>Download pronta 🐾</h3><p>' + esc(hint) + '</p>' +
      '<p>Il file apre ' + esc(browserUrl) + ' come app. Nessuna installazione, nessun file pesante.</p>' +
      '<a class="btn primary" href="' + browserUrl + '">Apri subito GattoBrowser</a> ' +
      '<button class="btn" type="button" onclick="document.getElementById(\'lmodal\').classList.add(\'hidden\')">Chiudi</button>');
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-dl]'), function (btn) {
    btn.addEventListener('click', function () { handleDownload(btn.dataset.dl); });
  });

  // registrazione del service worker per l'installazione come app
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
