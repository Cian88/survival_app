/* Compte Holdout : obligatoire, mais utilisable sans réseau.
   - Création et connexion par e-mail et mot de passe, possibles hors ligne : la vérification se fait sur l'appareil
     (déballage de la clé des données). Le compte créé hors ligne est enregistré sur le serveur au retour du réseau.
   - Google et Apple (réseau nécessaire) : une phrase de chiffrement protège les données et sert à se reconnecter hors ligne.
   - Sauvegarde chiffrée de bout en bout (js/vault-crypto.js), synchronisée dès que le réseau le permet.
   - Licences Premium rattachées au compte. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const V = window.VaultCrypto, C = (window.KS_CONFIG && window.KS_CONFIG.account) || {};
  const dev = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
  const API = dev('holdout.dev.api') || C.api || 'https://api.hold-out.app';
  const REC = 'holdout.account', BASE = 'holdout.sync', MIN_PW = 10;
  const NATIVE = !!(window.Native && Native.isNative);
  const PROVIDER = { password: 'e-mail et mot de passe', google: 'Google', apple: 'Apple' };

  /* ---------- État local du compte ----------
     rec : { id, email, provider, keys (emballées), token, pending, authKey (seulement le temps d'une connexion serveur en attente),
             emailVerified, unlocked, lastSync, syncError } */
  let rec = load(), dataKey = null, view = null, busy = false;
  function load() { try { return JSON.parse(localStorage.getItem(REC)) || null; } catch (e) { return null; } }
  function saveRec() {
    try { if (rec) localStorage.setItem(REC, JSON.stringify(rec)); else localStorage.removeItem(REC); } catch (e) { }
    if (window.Native && Native.mirror) Native.mirror(REC, rec ? JSON.stringify(rec) : null);
    renderStatus();
  }
  const loadBase = () => { try { return JSON.parse(localStorage.getItem(BASE)); } catch (e) { return null; } };
  const saveBase = b => { try { if (b) localStorage.setItem(BASE, JSON.stringify(b)); else localStorage.removeItem(BASE); } catch (e) { } };
  async function keepKey(key) { // copie non exportable gardée sur l'appareil : l'app rouvre sans redemander le secret
    const raw = await crypto.subtle.exportKey('raw', key);
    dataKey = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    await Store.idb.put('keys', 'dataKey', dataKey);
  }
  async function forgetKey() { dataKey = null; try { await Store.idb.del('keys', 'dataKey'); } catch (e) { } }
  const online = () => navigator.onLine !== false;

  /* ---------- Serveur ---------- */
  async function api(method, path, body, token = rec && rec.token) {
    let r;
    try {
      const ac = new AbortController(), timer = setTimeout(() => ac.abort(), 20000);
      r = await fetch(API + path, { method, signal: ac.signal, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined }).finally(() => clearTimeout(timer));
    } catch (e) { const err = new Error('Pas de connexion au serveur.'); err.offline = true; throw err; }
    let j = {}; try { j = await r.json(); } catch (e) { }
    if (!r.ok) { const err = new Error(j.error || 'Erreur ' + r.status); err.status = r.status; err.code = j.code; err.body = j; throw err; }
    return j;
  }
  const device = () => (NATIVE ? 'App iOS' : 'Web') + ' · ' + (navigator.userAgentData && navigator.userAgentData.platform || navigator.platform || '');

  /* ---------- Écran de connexion (obligatoire) ---------- */
  function gate() {
    let g = $('#authGate');
    if (!g) {
      g = document.createElement('div'); g.id = 'authGate'; g.className = 'auth-gate';
      g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true'); g.setAttribute('aria-labelledby', 'authTitle');
      document.body.appendChild(g);
      g.addEventListener('submit', onSubmit); g.addEventListener('click', onClick);
    }
    for (const el of document.body.children) if (el !== g) el.inert = true;
    return g;
  }
  function closeGate() {
    const g = $('#authGate'); if (g) g.remove();
    for (const el of document.body.children) el.inert = false;
    view = null;
  }
  const field = (name, label, type = 'text', extra = '') => `<label class="field" for="ag-${name}">${label}</label><input id="ag-${name}" name="${name}" type="${type}" ${extra}>`;
  // Acceptation des conditions : vaut pour l'e-mail comme pour Google et Apple.
  const legal = () => C.termsUrl || C.privacyUrl ? `<p class="small muted">En créant un compte ou en vous connectant, vous acceptez les ${C.termsUrl ? `<a href="${h(C.termsUrl)}" target="_blank" rel="noopener">conditions d'utilisation</a>` : 'conditions d\'utilisation'} et la ${C.privacyUrl ? `<a href="${h(C.privacyUrl)}" target="_blank" rel="noopener">politique de confidentialité</a>` : 'politique de confidentialité'}.</p>` : '';
  const netLine = () => `<p class="small muted auth-net">${online() ? 'En ligne.' : '<b>Hors ligne.</b> Création d\'un compte e-mail et connexion à un compte déjà utilisé sur cet appareil restent possibles.'}</p>`;
  function show(v, data = {}) {
    view = v; const g = gate(), known = rec && rec.keys;
    const provBtns = () => {
      const can = online(), g1 = googleAvailable(), a1 = appleAvailable();
      if (!g1 && !a1) return '';
      return `<div class="auth-providers">${a1 ? `<button type="button" class="btn auth-apple" data-ag="apple" ${can ? '' : 'disabled'}>Continuer avec Apple</button>` : ''}
        ${g1 ? (NATIVE ? `<button type="button" class="btn ghost auth-google" data-ag="google" ${can ? '' : 'disabled'}>Continuer avec Google</button>` : `<div id="gsiButton" class="auth-gsi">${can ? '<span class="small muted">Chargement de Google…</span>' : '<button type="button" class="btn ghost" disabled>Continuer avec Google</button>'}</div>`) : ''}
        ${can ? '' : '<p class="small muted">Google et Apple demandent une connexion Internet.</p>'}</div><p class="auth-or"><span>ou avec votre e-mail</span></p>`;
    };
    const err = data.error ? `<p class="auth-error" role="alert">${h(data.error)}</p>` : '';
    const html = {
      start: () => `<h2 id="authTitle">Votre compte Holdout</h2>
        <p class="muted">Il protège et sauvegarde vos données, chiffrées sur cet appareil avant tout envoi, et retrouve Premium sur vos autres appareils. Tout continue de fonctionner sans réseau.</p>
        ${provBtns()}
        <div class="auth-tabs" role="tablist"><button type="button" role="tab" data-ag="tab-create" aria-selected="${data.tab !== 'login'}">Créer un compte</button><button type="button" role="tab" data-ag="tab-login" aria-selected="${data.tab === 'login'}">Se connecter</button></div>
        ${err}
        ${data.tab === 'login' ? `<form data-form="login">${field('email', 'Adresse e-mail', 'email', `required autocomplete="email" value="${h(data.email || (rec && rec.email) || '')}"`)}${field('password', 'Mot de passe', 'password', 'required autocomplete="current-password"')}
            <button class="btn auth-submit">Se connecter</button></form><p class="small"><button type="button" class="link" data-ag="forgot">Mot de passe oublié ?</button></p>
            ${known && rec.provider !== 'password' ? `<p class="small"><button type="button" class="link" data-ag="unlock-local">Compte ${h(PROVIDER[rec.provider])} de cet appareil : déverrouiller avec la phrase de chiffrement</button></p>` : ''}`
          : `<form data-form="create">${field('email', 'Adresse e-mail', 'email', `required autocomplete="email" value="${h(data.email || '')}"`)}${field('password', `Mot de passe (${MIN_PW} caractères minimum)`, 'password', `required minlength="${MIN_PW}" autocomplete="new-password"`)}${field('password2', 'Confirmer le mot de passe', 'password', `required minlength="${MIN_PW}" autocomplete="new-password"`)}
            <button class="btn auth-submit">Créer mon compte</button></form>
            <p class="small muted">Le mot de passe ne quitte jamais cet appareil : il chiffre vos données.</p>`}
        ${legal()}${netLine()}${rec && rec.unlocked && dataKey ? '<p class="small"><button type="button" class="link" data-ag="later">Plus tard</button></p>' : ''}`,
      recovery: () => `<h2 id="authTitle">Votre code de secours</h2>
        <p>Notez ou imprimez ce code et gardez-le hors de votre téléphone (avec vos papiers importants). Il est <b>le seul moyen</b> de retrouver vos données si vous oubliez votre ${data.mode === 'phrase' ? 'phrase de chiffrement' : 'mot de passe'} : personne, pas même Holdout, ne peut les déchiffrer sans lui.</p>
        <p class="auth-code" aria-label="Code de secours">${h(data.code)}</p>
        <div class="row"><button type="button" class="btn ghost" data-ag="copy" data-code="${h(data.code)}">Copier</button><button type="button" class="btn ghost" data-ag="save-code" data-code="${h(data.code)}">Enregistrer en fichier</button></div>
        <form data-form="recovery-ok"><label class="chk"><input type="checkbox" name="ok" required> J'ai mis ce code en lieu sûr.</label><button class="btn auth-submit">Continuer</button></form>`,
      'phrase-new': () => `<h2 id="authTitle">Phrase de chiffrement</h2>
        <p class="muted">Avec ${h(PROVIDER[data.provider] || 'ce compte')}, il n'y a pas de mot de passe Holdout. Choisissez une phrase : elle chiffre vos données sur l'appareil et permet de vous reconnecter <b>sans réseau</b>.</p>${err}
        <form data-form="phrase-new">${field('phrase', `Phrase de chiffrement (${MIN_PW} caractères minimum)`, 'password', `required minlength="${MIN_PW}" autocomplete="new-password"`)}${field('phrase2', 'Confirmer la phrase', 'password', `required minlength="${MIN_PW}" autocomplete="new-password"`)}<button class="btn auth-submit">Valider</button></form>`,
      unlock: () => `<h2 id="authTitle">Déverrouiller vos données</h2>
        <p class="muted">${data.mode === 'password' ? `Saisissez le mot de passe Holdout de ${h(data.email || '')}.` : 'Saisissez votre phrase de chiffrement.'}</p>${err}
        <form data-form="unlock">${field('secret', data.mode === 'password' ? 'Mot de passe' : 'Phrase de chiffrement', 'password', 'required autocomplete="current-password"')}<button class="btn auth-submit">Déverrouiller</button></form>
        <p class="small"><button type="button" class="link" data-ag="use-recovery">J'utilise mon code de secours</button> · <button type="button" class="link" data-ag="back">Revenir</button></p>`,
      'recovery-enter': () => `<h2 id="authTitle">Code de secours</h2>
        <p class="muted">${data.reason || 'Saisissez le code de secours noté à la création du compte.'}</p>${err}
        <form data-form="recovery-enter">${field('code', 'Code de secours', 'text', 'required autocomplete="off" autocapitalize="characters" spellcheck="false"')}
          ${data.needNew ? field('phrase', `Nouvelle phrase de chiffrement (${MIN_PW} caractères minimum)`, 'password', `required minlength="${MIN_PW}" autocomplete="new-password"`) : ''}<button class="btn auth-submit">Déverrouiller</button></form>
        <p class="small"><button type="button" class="link" data-ag="lost">Je n'ai plus ce code</button> · <button type="button" class="link" data-ag="back">Revenir</button></p>`,
      lost: () => `<h2 id="authTitle">Repartir d'une sauvegarde neuve</h2>
        <p>Sans votre secret ni le code de secours, la sauvegarde en ligne ne peut pas être déchiffrée. Vous pouvez la remplacer par les données <b>présentes sur cet appareil</b> ; l'ancienne sauvegarde sera effacée.</p>${err}
        <form data-form="lost">${data.needNew ? field('phrase', `Nouvelle phrase de chiffrement (${MIN_PW} caractères minimum)`, 'password', `required minlength="${MIN_PW}" autocomplete="new-password"`) : ''}
          <label class="chk"><input type="checkbox" name="ok" required> Effacer l'ancienne sauvegarde et repartir de cet appareil.</label><button class="btn bad auth-submit">Repartir de zéro</button></form>
        <p class="small"><button type="button" class="link" data-ag="back">Revenir</button></p>`,
      busy: () => `<h2 id="authTitle">${h(data.title || 'Un instant…')}</h2><p class="muted" role="status">${h(data.text || '')}</p><div class="auth-spinner" aria-hidden="true"></div>`,
    }[v]();
    g.innerHTML = `<div class="auth-card"><div class="auth-brand"><span class="logo"><img class="mark-on-light" src="icons/logo-mark.png" alt=""><img class="mark-on-dark" src="icons/logo-mark-light.png" alt=""></span><b>holdout<span class="brand-dot">.</span></b></div>${html}</div>`;
    g.dataset.view = v; Object.assign(g.dataset, { tab: data.tab || '' });
    g._data = data;
    if (v === 'start' && !NATIVE && googleAvailable() && online()) renderGoogleWeb();
    const first = g.querySelector('input:not([type=checkbox]), .auth-submit'); if (first && v !== 'busy') setTimeout(() => first.focus(), 30);
  }
  const ctx = () => ($('#authGate') || {})._data || {};
  const wait = (title, text) => show('busy', { title, text });

  /* ---------- Parcours ---------- */
  // Après création des clés : le code de secours doit être noté avant d'entrer dans l'app.
  async function finishNew(key, code, mode) { await keepKey(key); rec.unlocked = true; saveRec(); show('recovery', { code, mode }); }
  function enter() { closeGate(); rec.unlocked = true; saveRec(); renderCard(); afterUnlock(); }

  async function createEmail(email, pw) {
    email = V.normEmail(email);
    wait('Création du compte', 'Calcul des clés de chiffrement sur cet appareil…');
    const { authKey, kek } = await V.fromPassword(email, pw), id = crypto.randomUUID();
    const key = await V.newDataKey(), code = V.newRecoveryCode();
    const keys = await V.makeKeys(key, kek, (await V.fromRecovery(code)).kek, 'password');
    let token = null, pending = 'register';
    if (online()) {
      try {
        const r = await api('POST', '/auth/register', { id, email, authKey, device: device() }, null);
        token = r.token; pending = null;
        await api('PUT', '/vault/keys', { keys, create: true }, token);
      } catch (e) {
        if (e.code === 'email_taken') return show('start', { tab: 'login', email, error: 'Un compte existe déjà avec cette adresse : connectez-vous.' });
        if (!e.offline) return show('start', { tab: 'create', email, error: e.message });
        token = null; pending = 'register'; // serveur injoignable : compte créé sur l'appareil, enregistré plus tard
      }
    }
    if (rec && rec.id && rec.id !== id) saveBase(null);
    rec = { id, email, provider: 'password', keys, token, pending, authKey: pending ? authKey : null, emailVerified: false, unlocked: false };
    saveRec(); await finishNew(key, code, 'password');
  }

  async function loginEmail(email, pw) {
    email = V.normEmail(email);
    wait('Connexion', 'Vérification sur cet appareil…');
    const { authKey, kek } = await V.fromPassword(email, pw);
    if (online()) {
      let r;
      try { r = await api('POST', '/auth/login', { email, authKey, device: device() }, null); }
      catch (e) {
        if (!e.offline) return show('start', { tab: 'login', email, error: e.message });
        r = null; // serveur injoignable : on tente la connexion locale
      }
      if (r) return joinAccount(r, { provider: 'password', kek, authKey });
    }
    // Hors ligne : seulement un compte déjà connu de cet appareil.
    if (!rec || rec.email !== email || !rec.keys) return show('start', { tab: 'login', email, error: 'Hors ligne, seul un compte déjà utilisé sur cet appareil peut se connecter. Vous pouvez aussi créer un compte.' });
    try { await keepKey(await V.unwrap(rec.keys.bySecret, kek, true)); }
    catch (e) { return show('start', { tab: 'login', email, error: 'Mot de passe incorrect.' }); }
    if (!rec.token) { rec.pending = rec.pending || 'login'; rec.authKey = authKey; }
    enter();
  }

  /* Le serveur a reconnu le compte : récupérer ou créer les clés, puis entrer. */
  async function joinAccount(r, { provider, kek }) {
    const prev = rec, other = rec && rec.id && rec.id !== r.user.id;
    // Reconnexion depuis l'app (session expirée) : même compte, mêmes clés, données déjà déverrouillées.
    // Avec un mot de passe, il faut aussi qu'il ouvre les clés : après un « mot de passe oublié », elles sont encore
    // emballées par l'ancien, et seul le code de secours permet de les ré-emballer pour les autres appareils.
    const opens = !kek || (r.keys && await V.unwrap(r.keys.bySecret, kek).then(() => true, () => false));
    if (!other && prev && prev.unlocked && dataKey && r.keys && opens && JSON.stringify(r.keys) === JSON.stringify(prev.keys)) {
      Object.assign(rec, { token: r.token, pending: null, authKey: null, emailVerified: r.user.emailVerified, providers: r.user.providers, syncError: null });
      return enter();
    }
    if (other && hasData() && !await UI.confirm(`Cet appareil contient les données d'un autre compte (${rec.email || 'inconnu'}). Les remplacer par celles de ${r.user.email || 'ce compte'} ?`, 'Remplacer')) return show('start', { tab: 'login' });
    if (other) { saveBase(null); App.applyState({}); }
    rec = { id: r.user.id, email: r.user.email, provider, keys: r.keys, token: r.token, pending: null, authKey: null, emailVerified: r.user.emailVerified, providers: r.user.providers, unlocked: false, licences: r.licences };
    saveRec();
    if (!r.keys) { // compte sans clés (créé via Google/Apple, ou sauvegarde réinitialisée)
      if (provider === 'password') return newKeys(kek, 'password');
      return show('phrase-new', { provider });
    }
    if (r.keys.mode === 'password' && kek) {
      try { await keepKey(await V.unwrap(r.keys.bySecret, kek, true)); return enter(); }
      catch (e) { return show('recovery-enter', { reason: 'Votre mot de passe a changé depuis la création de vos clés. Saisissez votre code de secours une fois pour déverrouiller vos données.', rewrap: kek }); }
    }
    show('unlock', { mode: r.keys.mode, email: r.user.email });
  }
  async function newKeys(kek, mode) {
    const key = await V.newDataKey(), code = V.newRecoveryCode();
    const keys = await V.makeKeys(key, kek, (await V.fromRecovery(code)).kek, mode);
    try { await api('PUT', '/vault/keys', { keys, create: true }); }
    catch (e) {
      if (e.code === 'keys_exist') { rec.keys = e.body.keys; saveRec(); return show('unlock', { mode: rec.keys.mode, email: rec.email }); }
      throw e;
    }
    rec.keys = keys; saveRec(); await finishNew(key, code, mode);
  }
  const secretKek = async secret => rec.keys.mode === 'password' ? (await V.fromPassword(rec.email, secret)).kek : (await V.fromPhrase(rec.id, secret)).kek;

  async function unlock(secret) {
    wait('Déverrouillage', 'Vérification sur cet appareil…');
    try { await keepKey(await V.unwrap(rec.keys.bySecret, await secretKek(secret), true)); }
    catch (e) { return show('unlock', { ...ctx(), error: rec.keys.mode === 'password' ? 'Mot de passe incorrect.' : 'Phrase de chiffrement incorrecte.' }); }
    if (rec.pending === 'unlock') rec.pending = null;
    if (!rec.token && rec.provider !== 'password') rec.pending = 'oauth';
    enter();
  }
  async function useRecovery(code, phrase) {
    const d = ctx(); wait('Code de secours', 'Vérification…');
    let key;
    try { key = await V.unwrap(rec.keys.byRecovery, (await V.fromRecovery(code)).kek, true); }
    catch (e) { return show('recovery-enter', { ...d, error: 'Code de secours incorrect.' }); }
    // Le secret a changé ou est oublié : on ré-emballe la clé avec le secret actuel (ou la nouvelle phrase).
    const kek = d.rewrap || (phrase ? (await V.fromPhrase(rec.id, phrase)).kek : null);
    if (kek) {
      const keys = { ...rec.keys, bySecret: await V.wrap(key, kek), mode: d.rewrap ? 'password' : 'phrase' };
      if (rec.token && online()) await api('PUT', '/vault/keys', { keys });
      rec.keys = keys;
    }
    await keepKey(key); enter();
  }
  async function startOver(phrase) {
    const kek = ctx().rewrap || (phrase ? (await V.fromPhrase(rec.id, phrase)).kek : null);
    if (!kek) return show('lost', { ...ctx(), error: 'Choisissez une phrase de chiffrement.' });
    wait('Nouvelle sauvegarde', 'Création des clés…');
    await api('DELETE', '/vault', { confirm: 'REINITIALISER' });
    saveBase(null); rec.keys = null;
    await newKeys(kek, rec.provider === 'password' ? 'password' : 'phrase');
  }

  /* ---------- Google et Apple ---------- */
  const googleAvailable = () => !!(NATIVE ? C.google && C.google.iosClientId : C.google && C.google.webClientId);
  const appleAvailable = () => !!(NATIVE ? window.Native && Native.SocialLogin : C.apple && C.apple.servicesId);
  const loadScript = src => new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = () => rej(new Error('script indisponible')); document.head.appendChild(s); });
  let socialReady = null;
  function social() {
    return socialReady || (socialReady = Native.SocialLogin.initialize({
      google: C.google && C.google.iosClientId ? { iOSClientId: C.google.iosClientId, iOSServerClientId: C.google.webClientId } : undefined,
      apple: { clientId: 'com.holdout.app' },
    }));
  }
  async function renderGoogleWeb() {
    const el = $('#gsiButton'); if (!el) return;
    try {
      await loadScript('https://accounts.google.com/gsi/client');
      google.accounts.id.initialize({ client_id: C.google.webClientId, callback: r => oauth('google', { idToken: r.credential }), ux_mode: 'popup' });
      el.innerHTML = ''; google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', text: 'continue_with', locale: 'fr', width: Math.min(360, el.clientWidth || 320) });
    } catch (e) { el.innerHTML = '<p class="small muted">Connexion Google indisponible pour le moment.</p>'; }
  }
  async function providerToken(p) {
    if (NATIVE) {
      await social();
      const r = await Native.SocialLogin.login({ provider: p, options: { scopes: p === 'apple' ? ['email', 'name'] : ['email', 'profile'] } });
      const res = r.result || r;
      return { idToken: res.idToken, authorizationCode: res.authorizationCode };
    }
    if (p === 'apple') {
      await loadScript('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/fr_FR/appleid.auth.js');
      AppleID.auth.init({ clientId: C.apple.servicesId, scope: 'name email', redirectURI: C.apple.redirectUri || location.origin + '/', usePopup: true });
      const r = await AppleID.auth.signIn();
      return { idToken: r.authorization.id_token, authorizationCode: r.authorization.code };
    }
    throw new Error('fournisseur inconnu');
  }
  async function oauth(p, tok) {
    try {
      tok = tok || await providerToken(p);
      if (!tok.idToken) throw new Error('connexion annulée');
      wait('Connexion', `Vérification de votre compte ${PROVIDER[p]}…`);
      const r = await api('POST', '/auth/' + p, { ...tok, device: device() }, null);
      await joinAccount(r, { provider: p });
    } catch (e) { show('start', { tab: 'create', error: /annul|cancel/i.test(e.message) ? '' : `Connexion ${PROVIDER[p]} impossible : ${e.message}` }); }
  }

  /* ---------- Événements de l'écran de connexion ---------- */
  async function onSubmit(e) {
    e.preventDefault(); e.stopPropagation();
    if (busy) return; busy = true;
    const f = e.target, o = Object.fromEntries(new FormData(f).entries());
    try {
      switch (f.dataset.form) {
        case 'create':
          if (o.password.length < MIN_PW) return show('start', { tab: 'create', email: o.email, error: `Mot de passe trop court (${MIN_PW} caractères minimum).` });
          if (o.password !== o.password2) return show('start', { tab: 'create', email: o.email, error: 'Les deux mots de passe ne correspondent pas.' });
          return await createEmail(o.email, o.password);
        case 'login': return await loginEmail(o.email, o.password);
        case 'recovery-ok': return enter();
        case 'phrase-new':
          if (o.phrase.length < MIN_PW || o.phrase !== o.phrase2) return show('phrase-new', { ...ctx(), error: o.phrase !== o.phrase2 ? 'Les deux phrases ne correspondent pas.' : `Phrase trop courte (${MIN_PW} caractères minimum).` });
          wait('Phrase de chiffrement', 'Calcul des clés…');
          return await newKeys((await V.fromPhrase(rec.id, o.phrase)).kek, 'phrase');
        case 'unlock': return await unlock(o.secret);
        case 'recovery-enter': return await useRecovery(o.code, o.phrase);
        case 'lost': return await startOver(o.phrase);
      }
    } catch (err) { show(view === 'busy' ? 'start' : view, { ...ctx(), error: err.message }); }
    finally { busy = false; }
  }
  function onClick(e) {
    const b = e.target.closest('[data-ag]'); if (!b) return;
    const d = ctx();
    switch (b.dataset.ag) {
      case 'tab-create': return show('start', { tab: 'create' });
      case 'tab-login': return show('start', { tab: 'login' });
      case 'google': return oauth('google');
      case 'apple': return oauth('apple');
      case 'unlock-local': return show('unlock', { mode: rec.keys.mode, email: rec.email });
      case 'use-recovery': return show('recovery-enter', { needNew: rec.keys.mode === 'phrase' && !d.rewrap, rewrap: d.rewrap });
      case 'lost': return online() && rec && rec.token ? show('lost', { needNew: !d.rewrap, rewrap: d.rewrap }) : show(view, { ...d, error: 'Une connexion Internet est nécessaire pour repartir d\'une sauvegarde neuve.' });
      case 'back': return rec && rec.token && !rec.unlocked && rec.keys ? show('unlock', { mode: rec.keys.mode, email: rec.email }) : show('start', { tab: 'login' });
      case 'copy': return navigator.clipboard && navigator.clipboard.writeText(b.dataset.code).then(() => { b.textContent = 'Copié'; });
      case 'save-code': return App.download('holdout-code-de-secours.txt', `Code de secours Holdout\nCompte : ${rec.email || rec.id}\n\n${b.dataset.code}\n\nGardez ce code hors de votre téléphone. Il permet de retrouver vos données chiffrées si vous oubliez votre ${rec.keys && rec.keys.mode === 'phrase' ? 'phrase de chiffrement' : 'mot de passe'}.\n`, 'text/plain');
      case 'forgot': return forgot();
      case 'later': return closeGate();
    }
  }
  async function forgot() {
    const o = await UI.ask('Mot de passe oublié', [{ name: 'email', label: 'Adresse e-mail du compte', type: 'email', value: (rec && rec.email) || '', required: true }], 'Envoyer le lien');
    if (!o) return;
    try { await api('POST', '/auth/forgot', { email: o.email }, null); UI.notice('Si un compte existe pour cette adresse, un lien pour choisir un nouveau mot de passe vient d\'être envoyé (valable 1 heure). Votre code de secours vous sera ensuite demandé pour déverrouiller vos données.'); }
    catch (e) { UI.notice(e.offline ? 'Une connexion Internet est nécessaire pour recevoir le lien.' : e.message); }
  }

  /* ---------- Opérations en attente (comptes créés ou connectés hors ligne) ---------- */
  let finishing = null;
  function finishPending() { return finishing || (finishing = doFinish().finally(() => { finishing = null; })); }
  async function doFinish() {
    if (!rec || !rec.pending || !online()) return;
    if (rec.pending === 'register') {
      try {
        const r = await api('POST', '/auth/register', { id: rec.id, email: rec.email, authKey: rec.authKey, device: device() }, null);
        rec.token = r.token; rec.pending = null; rec.authKey = null; saveRec();
        await api('PUT', '/vault/keys', { keys: rec.keys, create: true });
        return;
      } catch (e) {
        if (e.offline) return;
        if (e.code !== 'email_taken') { rec.syncError = e.message; return saveRec(); }
        rec.pending = 'login'; saveRec(); // le compte existe déjà : même mot de passe ?
      }
    }
    if (rec.pending === 'login' && rec.authKey) {
      try {
        const r = await api('POST', '/auth/login', { email: rec.email, authKey: rec.authKey, device: device() }, null);
        const adopt = r.user.id !== rec.id; // compte créé hors ligne alors qu'il existait : on rejoint le compte du serveur
        rec.token = r.token; rec.authKey = null; rec.pending = null; rec.emailVerified = r.user.emailVerified;
        if (adopt) {
          // Même adresse et même mot de passe : on rejoint le compte du serveur. Ses clés se déballent avec ce mot de passe,
          // redemandé une fois (il n'est jamais gardé) ; les données de l'appareil priment à la fusion.
          rec.id = r.user.id; saveBase(null);
          if (r.keys) { rec.keys = r.keys; rec.pending = 'unlock'; rec.localWins = true; }
          else await api('PUT', '/vault/keys', { keys: rec.keys, create: true });
        }
        saveRec();
      } catch (e) {
        if (e.offline) return;
        if (e.status === 401 || e.status === 429) { rec.pending = 'relogin'; rec.authKey = null; saveRec(); }
      }
    }
  }

  /* ---------- Synchronisation ---------- */
  let syncing = false, again = false, timer = null;
  const canSync = () => rec && rec.unlocked && rec.token && !rec.pending && dataKey && online();
  function changed() { if (applying) return; clearTimeout(timer); timer = setTimeout(sync, 4000); }
  let applying = false;
  async function sync(opts = {}) {
    if (syncing) { again = true; return; }
    await finishPending().catch(() => { });
    if (!canSync()) return renderStatus();
    syncing = true; renderStatus();
    try {
      const me = await api('GET', '/me');
      rec.emailVerified = me.user.emailVerified; rec.providers = me.user.providers;
      if (me.keys && JSON.stringify(me.keys) !== JSON.stringify(rec.keys)) {
        // Clés changées sur un autre appareil (nouveau mot de passe, nouveau code) : la clé des données est-elle la même ?
        rec.keys = me.keys;
      }
      adoptLicences(me.licences || []);
      for (let i = 0; i < 4; i++) {
        const base = loadBase(), mine = base && base.userId === rec.id ? base : null;
        const remoteVersion = me.vault ? me.vault.version : 0, local = JSON.parse(JSON.stringify(App.state));
        if (i === 0 && mine && remoteVersion === mine.version && V.same(local, mine.snapshot)) break; // rien à faire
        let remote = null, next, push;
        if (remoteVersion && (!mine || mine.version !== remoteVersion)) {
          const v = await api('GET', '/vault');
          me.vault = { version: v.version };
          try { remote = await V.decryptState(dataKey, v.data); }
          catch (e) { rec.pending = 'unlock'; saveRec(); throw new Error('sauvegarde chiffrée avec d\'autres clés : déverrouillez à nouveau'); }
        }
        if (!remote) { next = local; push = !mine || !V.same(local, mine.snapshot) || !remoteVersion; }
        else if (!mine) { next = opts.localWins ? Object.assign({}, remote, local) : Object.assign({}, local, remote); push = !V.same(next, remote); }
        else { next = V.merge3(mine.snapshot, local, remote).state; push = !V.same(next, remote); }
        if (!V.same(next, local)) apply(next);
        const version = me.vault ? me.vault.version : 0;
        if (push) {
          try { const r = await api('PUT', '/vault', { baseVersion: version, data: await V.encryptState(dataKey, next) }); saveBase({ userId: rec.id, version: r.version, snapshot: next }); }
          catch (e) { if (e.status === 409) { me.vault = { version: e.body.version }; continue; } throw e; }
        } else saveBase({ userId: rec.id, version, snapshot: next });
        break;
      }
      rec.lastSync = Date.now(); rec.syncError = null;
    } catch (e) {
      if (e.status === 401) { rec.token = null; rec.pending = rec.provider === 'password' ? 'relogin' : 'oauth'; }
      else if (!e.offline) rec.syncError = e.message;
    } finally {
      syncing = false; saveRec(); renderCard();
      if (again) { again = false; setTimeout(sync, 500); }
    }
  }
  function apply(next) { applying = true; try { App.applyState(next); } finally { applying = false; } }
  const hasData = () => { const s = App.state || {}; return !!(s.onboarded || (s.inventory || []).length || (s.contacts || []).length || (s.points || []).length); };

  /* ---------- Premium ---------- */
  async function adoptLicences(list) {
    if (!window.Premium || !list.length || Premium.isPremium()) return;
    const parse = t => { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { return {}; } };
    const best = list.map(t => ({ t, p: parse(t) })).sort((a, b) => (b.p.exp == null ? Infinity : b.p.exp) - (a.p.exp == null ? Infinity : a.p.exp));
    for (const { t } of best) { try { await Premium.activate(t, { fromAccount: true }); App.refresh(); return; } catch (e) { } }
  }
  function reportLicence(tok) { if (rec && rec.token && online()) api('POST', '/me/licences', { licence: tok }).catch(() => { }); }
  async function reportAppStore(transactionId) {
    if (!rec || !rec.token || !online() || !transactionId) return null;
    try { const r = await api('POST', '/me/appstore', { transactionId: String(transactionId) }); return r.licence; } catch (e) { return null; }
  }

  /* ---------- Carte « Mon compte » (onglet Profil) et bandeau ---------- */
  function statusText() {
    if (!rec) return '';
    if (!online()) return 'Hors ligne : vos données restent sur l\'appareil, la synchronisation reprendra au retour du réseau.';
    if (syncing) return 'Synchronisation…';
    if (rec.pending === 'register') return 'Compte créé sur l\'appareil : enregistrement en ligne en cours.';
    if (rec.pending === 'relogin') return 'Mot de passe changé ailleurs, ou compte déjà existant avec un autre mot de passe : reconnectez-vous pour synchroniser.';
    if (rec.pending === 'oauth') return `Reconnectez-vous avec ${PROVIDER[rec.provider]} pour synchroniser.`;
    if (rec.pending === 'unlock') return 'Déverrouillez à nouveau vos données pour reprendre la synchronisation.';
    if (rec.syncError) return 'Synchronisation impossible : ' + rec.syncError;
    if (rec.lastSync) return 'Sauvegarde chiffrée à jour (' + new Date(rec.lastSync).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) + ').';
    return 'Sauvegarde en attente.';
  }
  function renderStatus() {
    const b = $('#accountBanner'), needs = rec && rec.unlocked && ['relogin', 'oauth', 'unlock'].includes(rec.pending) && online();
    if (b) { b.hidden = !needs; if (needs) b.innerHTML = `<span>${h(statusText())}</span> <button class="btn ghost" data-acct="reconnect">Reprendre</button>`; }
    const s = $('#acctStatus'); if (s) s.textContent = statusText();
  }
  function renderCard() {
    const el = $('#accountCard'); if (!el || !rec) return renderStatus();
    const pw = rec.provider === 'password' || (rec.providers || []).includes('password');
    el.innerHTML = `<div class="row between"><h3>Mon compte</h3><span class="pill">${h(PROVIDER[rec.provider] || '')}</span></div>
      <p><b>${h(rec.email || 'Compte ' + PROVIDER[rec.provider])}</b>${rec.email && !rec.emailVerified && !rec.pending ? ' · <span class="danger">adresse non confirmée</span> <button class="link" data-acct="resend">renvoyer l\'e-mail</button>' : ''}</p>
      <p class="small muted" id="acctStatus" role="status">${h(statusText())}</p>
      <p class="small muted">Vos données sont chiffrées sur cet appareil avant tout envoi ; le serveur ne peut pas les lire. Les cartes hors ligne restent sur l'appareil.</p>
      <div class="row"><button class="btn ghost" data-acct="sync">Synchroniser maintenant</button>
        ${pw ? '<button class="btn ghost" data-acct="password">Changer le mot de passe</button>' : '<button class="btn ghost" data-acct="phrase">Changer la phrase de chiffrement</button>'}
        <button class="btn ghost" data-acct="recovery">Nouveau code de secours</button></div>
      <div class="row"><button class="btn ghost" data-acct="logout">Se déconnecter</button><button class="btn ghost danger" data-acct="delete">Supprimer mon compte</button></div>`;
  }
  async function askSecret(title) {
    const mode = rec.keys && rec.keys.mode;
    const o = await UI.ask(title, [{ name: 's', label: mode === 'password' ? 'Mot de passe actuel' : 'Phrase de chiffrement actuelle', type: 'password', required: true }], 'Continuer');
    if (!o) return null;
    try { return { key: await V.unwrap(rec.keys.bySecret, await secretKek(o.s), true), secret: o.s }; }
    catch (e) { UI.notice(mode === 'password' ? 'Mot de passe incorrect.' : 'Phrase de chiffrement incorrecte.'); return null; }
  }
  async function accountAction(a) {
    const needNet = () => { if (online() && rec.token) return true; UI.notice('Une connexion Internet est nécessaire pour cette opération.'); return false; };
    try {
      switch (a) {
        case 'sync': if (!online()) return UI.notice('Hors ligne : la synchronisation reprendra au retour du réseau.'); return sync();
        case 'resend': if (!needNet()) return; await api('POST', '/auth/resend'); return UI.notice('E-mail de confirmation envoyé.');
        case 'reconnect':
          if (rec.pending === 'oauth') { closeGate(); return show('start', { tab: 'create' }); }
          if (rec.pending === 'relogin') return show('start', { tab: 'login', email: rec.email, error: 'Reconnectez-vous pour reprendre la synchronisation.' });
          return show('unlock', { mode: rec.keys.mode, email: rec.email });
        case 'password': {
          if (!needNet()) return;
          const o = await UI.ask('Changer le mot de passe', [{ name: 'cur', label: 'Mot de passe actuel', type: 'password', required: true }, { name: 'n1', label: `Nouveau mot de passe (${MIN_PW} caractères minimum)`, type: 'password', required: true }, { name: 'n2', label: 'Confirmer', type: 'password', required: true }], 'Changer');
          if (!o) return;
          if (o.n1.length < MIN_PW || o.n1 !== o.n2) return UI.notice(o.n1 !== o.n2 ? 'Les deux mots de passe ne correspondent pas.' : 'Mot de passe trop court.');
          const cur = await V.fromPassword(rec.email, o.cur), nw = await V.fromPassword(rec.email, o.n1);
          const key = await V.unwrap(rec.keys.bySecret, cur.kek, true).catch(() => null);
          if (!key) return UI.notice('Mot de passe actuel incorrect.');
          await api('POST', '/me/password', { currentAuthKey: cur.authKey, authKey: nw.authKey });
          const keys = { ...rec.keys, bySecret: await V.wrap(key, nw.kek) };
          await api('PUT', '/vault/keys', { keys }); rec.keys = keys; saveRec();
          return UI.notice('Mot de passe changé. Les autres appareils devront se reconnecter.');
        }
        case 'phrase': {
          if (!needNet()) return;
          const s = await askSecret('Changer la phrase de chiffrement'); if (!s) return;
          const o = await UI.ask('Nouvelle phrase', [{ name: 'n1', label: `Nouvelle phrase (${MIN_PW} caractères minimum)`, type: 'password', required: true }, { name: 'n2', label: 'Confirmer', type: 'password', required: true }], 'Changer');
          if (!o || o.n1.length < MIN_PW || o.n1 !== o.n2) return o && UI.notice('Les phrases ne correspondent pas, ou sont trop courtes.');
          const keys = { ...rec.keys, bySecret: await V.wrap(s.key, (await V.fromPhrase(rec.id, o.n1)).kek) };
          await api('PUT', '/vault/keys', { keys }); rec.keys = keys; saveRec();
          return UI.notice('Phrase de chiffrement changée.');
        }
        case 'recovery': {
          if (!needNet()) return;
          const s = await askSecret('Nouveau code de secours'); if (!s) return;
          const code = V.newRecoveryCode(), keys = { ...rec.keys, byRecovery: await V.wrap(s.key, (await V.fromRecovery(code)).kek) };
          await api('PUT', '/vault/keys', { keys }); rec.keys = keys; saveRec();
          return show('recovery', { code, mode: keys.mode });
        }
        case 'logout': {
          if (!await UI.confirm('Se déconnecter de cet appareil ? Vos données y restent ; vous pourrez vous reconnecter, même sans réseau.', 'Se déconnecter', false)) return;
          await sync().catch(() => { });
          if (online() && rec.token) await api('POST', '/auth/logout').catch(() => { });
          rec.token = null; rec.unlocked = false; rec.authKey = null; rec.pending = null; saveRec(); await forgetKey();
          return show('start', { tab: 'login' });
        }
        case 'delete': {
          if (!needNet()) return;
          const o = await UI.ask('Supprimer mon compte', [{ name: 'c', label: 'Le compte, la sauvegarde chiffrée et les licences rattachées seront supprimés du serveur. Les données restent sur cet appareil. Tapez SUPPRIMER pour confirmer.', required: true }], 'Supprimer définitivement');
          if (!o || o.c.trim().toUpperCase() !== 'SUPPRIMER') return;
          await api('DELETE', '/me', { confirm: 'SUPPRIMER' });
          rec = null; saveRec(); saveBase(null); await forgetKey();
          return show('start', { tab: 'create', error: 'Compte supprimé. Créez un compte pour continuer à utiliser Holdout.' });
        }
      }
    } catch (e) { UI.notice(e.offline ? 'Pas de connexion au serveur.' : e.message); }
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-acct]'); if (b) { e.stopPropagation(); accountAction(b.dataset.acct); } }, true);

  /* ---------- Démarrage ---------- */
  function afterUnlock() {
    const localWins = !!rec.localWins; delete rec.localWins;
    sync({ localWins }).catch(() => { });
  }
  async function init() {
    const banner = document.createElement('div'); banner.id = 'accountBanner'; banner.className = 'account-banner'; banner.hidden = true; banner.setAttribute('role', 'status');
    const main = $('#main'); if (main) main.prepend(banner);
    if (rec && rec.unlocked) { try { dataKey = await Store.idb.get('keys', 'dataKey'); } catch (e) { dataKey = null; } }
    if (!rec || !rec.unlocked || !dataKey) {
      if (rec) { rec.unlocked = false; saveRec(); }
      return show('start', { tab: rec && rec.keys ? 'login' : 'create' });
    }
    renderStatus(); sync().catch(() => { });
  }
  window.addEventListener('online', () => { if ($('#authGate') && view === 'start') show('start', ctx()); sync(); });
  window.addEventListener('offline', () => { if ($('#authGate') && view === 'start') show('start', ctx()); renderStatus(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync(); });
  setInterval(() => { if (document.visibilityState === 'visible') sync(); }, 10 * 60 * 1000);

  // loginWithIdToken : point d'entrée des jetons Google ou Apple (bouton Google web, pages de test).
  window.Account = { init, sync, changed, renderCard, reportLicence, reportAppStore, loginWithIdToken: (p, tok) => oauth(p, tok), get user() { return rec; }, get api() { return API; } };
})();
