/* Chiffrement de bout en bout du compte Holdout (WebCrypto, navigateur et Node).
   - Clé maîtresse = PBKDF2-SHA256 (600 000 itérations) du mot de passe (sel lié à l'e-mail) ou de la phrase de
     chiffrement (sel lié au compte). Calculée sur l'appareil : le mot de passe ne quitte jamais l'appareil.
   - De la clé maîtresse dérivent (HKDF) : la clé de connexion envoyée au serveur, et la clé qui protège la clé des
     données. Le serveur ne peut pas remonter de l'une à l'autre.
   - Clé des données (AES-256-GCM, aléatoire) : chiffre la sauvegarde. Elle est gardée « emballée » deux fois :
     par le mot de passe (ou la phrase) et par le code de secours.
   - Fusion à trois voies par rubrique (profil, sacs, inventaire…) pour la synchronisation. */
(function (root) {
  const subtle = root.crypto.subtle, te = new TextEncoder(), td = new TextDecoder();
  const ITER = 600000; // recommandation OWASP 2023 pour PBKDF2-HMAC-SHA256
  const b64u = u8 => { let s = ''; const a = new Uint8Array(u8); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64u = s => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(s).length + 3) % 4)), c => c.charCodeAt(0));
  const rand = n => root.crypto.getRandomValues(new Uint8Array(n));
  const normEmail = e => String(e || '').trim().toLowerCase();

  /* ---------- Dérivations ---------- */
  async function master(secret, salt, iter = ITER) {
    const k = await subtle.importKey('raw', te.encode(String(secret).normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
    const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: te.encode(salt), iterations: iter }, k, 256);
    return subtle.importKey('raw', bits, 'HKDF', false, ['deriveBits', 'deriveKey']);
  }
  const hkdfBits = (m, info) => subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: te.encode(info) }, m, 256);
  const hkdfKey = (m, info) => subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: te.encode(info) }, m, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  /* Compte e-mail : clé de connexion (pour le serveur) et clé d'emballage, en un seul calcul lent. */
  async function fromPassword(email, password, iter) {
    const m = await master(password, 'holdout-password|' + normEmail(email), iter);
    return { authKey: b64u(await hkdfBits(m, 'holdout-auth')), kek: await hkdfKey(m, 'holdout-kek') };
  }
  /* Compte Google ou Apple : phrase de chiffrement, sel lié à l'identifiant du compte. */
  async function fromPhrase(userId, phrase, iter) {
    return { kek: await hkdfKey(await master(phrase, 'holdout-phrase|' + userId, iter), 'holdout-kek') };
  }

  /* ---------- Code de secours : 130 bits aléatoires, 26 caractères base32 Crockford (sans I, L, O, U) ---------- */
  const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  function newRecoveryCode() {
    const bytes = rand(17); let bits = 0, acc = 0, out = '';
    for (const b of bytes) { acc = (acc << 8) | b; bits += 8; while (bits >= 5 && out.length < 26) { bits -= 5; out += B32[(acc >> bits) & 31]; } }
    return out.replace(/(.{4})(?=.)/g, '$1-');
  }
  // Saisie tolérante : minuscules, tirets, espaces, et O/I/L lus comme 0/1/1.
  const cleanCode = c => String(c || '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/[^0-9A-Z]/g, '');
  async function fromRecovery(code) {
    const m = await subtle.importKey('raw', te.encode('holdout-recovery|' + cleanCode(code)), 'HKDF', false, ['deriveKey']);
    return { kek: await hkdfKey(m, 'holdout-recovery-kek') };
  }

  /* ---------- Clé des données et emballages ---------- */
  async function newDataKey() { return subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']); }
  async function seal(key, bytes) { const iv = rand(12); return { iv: b64u(iv), ct: b64u(await subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes)) }; }
  async function open(key, box) { return new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: unb64u(box.iv) }, key, unb64u(box.ct))); }
  async function wrap(dataKey, kek) { return seal(kek, await subtle.exportKey('raw', dataKey)); }
  /* Déballe la clé des données. extractable : nécessaire seulement pour la ré-emballer (changement de secret). */
  async function unwrap(box, kek, extractable = false) {
    const raw = await open(kek, box).catch(() => { throw new Error('secret incorrect'); });
    return subtle.importKey('raw', raw, { name: 'AES-GCM' }, extractable, ['encrypt', 'decrypt']);
  }
  /* Jeu de clés stocké par le serveur (et sur l'appareil) : rien n'y est lisible sans le secret ou le code de secours. */
  async function makeKeys(dataKey, secretKek, recoveryKek, mode) {
    return { v: 1, mode, iter: ITER, bySecret: await wrap(dataKey, secretKek), byRecovery: await wrap(dataKey, recoveryKek) };
  }

  /* ---------- Sauvegarde chiffrée ---------- */
  async function gzip(bytes, dir) {
    if (typeof CompressionStream === 'undefined') return bytes;
    const s = new Blob([bytes]).stream().pipeThrough(dir === 'c' ? new CompressionStream('gzip') : new DecompressionStream('gzip'));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  async function encryptState(dataKey, state) {
    const z = typeof CompressionStream !== 'undefined';
    const box = await seal(dataKey, await gzip(te.encode(JSON.stringify(state)), z ? 'c' : null));
    return JSON.stringify({ v: 1, z, ...box });
  }
  async function decryptState(dataKey, data) {
    const o = typeof data === 'string' ? JSON.parse(data) : data;
    const bytes = await open(dataKey, o).catch(() => { throw new Error('sauvegarde illisible avec cette clé'); });
    return JSON.parse(td.decode(o.z ? await gzip(bytes, 'd') : bytes));
  }

  /* ---------- Fusion à trois voies par rubrique ----------
     base : dernier état synchronisé ; local : cet appareil ; remote : serveur.
     Rubrique modifiée d'un seul côté : ce côté gagne. Des deux côtés : l'appareil gagne (préfère ce que l'on voit). */
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function merge3(base, local, remote) {
    base = base || {}; const out = {}, conflicts = [];
    for (const k of new Set([...Object.keys(local || {}), ...Object.keys(remote || {}), ...Object.keys(base)])) {
      const b = base[k], l = (local || {})[k], r = (remote || {})[k];
      const lc = !same(l, b), rc = !same(r, b);
      const v = lc && rc ? (same(l, r) ? l : (conflicts.push(k), l)) : lc ? l : r;
      if (v !== undefined) out[k] = v;
    }
    return { state: out, conflicts };
  }

  const api = { ITER, b64u, unb64u, normEmail, fromPassword, fromPhrase, newRecoveryCode, cleanCode, fromRecovery, newDataKey, wrap, unwrap, makeKeys, encryptState, decryptState, merge3, same };
  root.VaultCrypto = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
