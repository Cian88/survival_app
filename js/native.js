/* Pont vers les fonctions natives iOS (Capacitor). Dans un navigateur, tout retombe sur les API web.
   - GPS : plugin Geolocation (fonctionne sans Internet)
   - Fichiers : écriture dans le cache puis feuille de partage iOS (Enregistrer dans Fichiers, AirDrop…)
   - Sauvegarde : copie de l'état dans les préférences natives (résiste à un nettoyage du stockage web)
   - Achats intégrés : StoreKit via @capgo/native-purchases (obligatoire sur l'App Store, règle 3.1.1) */
(function () {
  const Cap = window.Capacitor;
  const isNative = !!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform());
  const plug = name => (isNative && Cap.registerPlugin ? Cap.registerPlugin(name) : null);
  const Geolocation = plug('Geolocation'), Filesystem = plug('Filesystem'), Share = plug('Share'), Preferences = plug('Preferences'), Purchases = plug('NativePurchases');
  const STATE_KEY = 'survie.v1';

  async function getPosition() {
    if (!isNative) return new Promise((res, rej) => {
      if (!navigator.geolocation) return rej(new Error('géolocalisation indisponible'));
      navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy }), rej, { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
    });
    let perm = await Geolocation.checkPermissions();
    if (perm.location !== 'granted') perm = await Geolocation.requestPermissions();
    if (perm.location === 'denied') throw new Error('autorisation de localisation refusée (Réglages > Survonomy > Position)');
    const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
    return { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy };
  }

  const toB64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  /* Enregistre un fichier et ouvre la feuille de partage iOS. content : texte ou Blob. */
  async function saveFile(name, content, mime) {
    const safe = name.replace(/[^\w.-]+/g, '_');
    if (typeof content === 'string') {
      await Filesystem.writeFile({ path: safe, data: content, directory: 'CACHE', encoding: 'utf8' });
    } else {
      const CH = 3 * 1024 * 1024; // multiple de 3 : les morceaux base64 se concatènent sans remplissage
      for (let off = 0, first = true; off < content.size || first; off += CH, first = false) {
        const b64 = toB64(new Uint8Array(await content.slice(off, off + CH).arrayBuffer()));
        if (first) await Filesystem.writeFile({ path: safe, data: b64, directory: 'CACHE' });
        else await Filesystem.appendFile({ path: safe, data: b64, directory: 'CACHE' });
        if (content.size === 0) break;
      }
    }
    const { uri } = await Filesystem.getUri({ path: safe, directory: 'CACHE' });
    await Share.share({ title: name, url: uri, dialogTitle: 'Enregistrer ou partager' });
  }

  /* Copie de sécurité de l'état dans les préférences natives, et restauration au démarrage si le stockage web a été vidé. */
  function mirrorState(json) { if (isNative) Preferences.set({ key: STATE_KEY, value: json }).catch(() => { }); }
  async function restoreIfNeeded() {
    if (!isNative) return false;
    let local = null; try { local = localStorage.getItem(STATE_KEY); } catch (e) { }
    if (local) return false;
    const { value } = await Preferences.get({ key: STATE_KEY });
    if (!value) return false;
    try { localStorage.setItem(STATE_KEY, value); } catch (e) { return false; }
    return true;
  }

  window.Native = { isNative, platform: isNative ? Cap.getPlatform() : 'web', getPosition, saveFile, mirrorState, restoreIfNeeded, Purchases };
  if (isNative) {
    document.documentElement.classList.add('native', 'native-' + Cap.getPlatform());
    restoreIfNeeded().then(r => { if (r) location.reload(); }).catch(() => { });
  }
})();
