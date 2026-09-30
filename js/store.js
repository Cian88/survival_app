/* Stockage local : localStorage (état de l'app) + IndexedDB (tuiles et points OSM).
   Tout reste sur l'appareil, rien n'est envoyé à un serveur. */
(function () {
  const KEY = 'survie.v1';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { console.warn('Sauvegarde impossible', e); return false; }
  }

  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB indisponible'));
      const req = indexedDB.open('survie', 2);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('tiles')) d.createObjectStore('tiles');
        if (!d.objectStoreNames.contains('osm')) d.createObjectStore('osm');
        if (!d.objectStoreNames.contains('packs')) d.createObjectStore('packs');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }
  function tx(store, mode, fn) {
    return db().then(d => new Promise((resolve, reject) => {
      const t = d.transaction(store, mode);
      const r = fn(t.objectStore(store));
      t.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    }));
  }
  const idb = {
    get: (store, key) => tx(store, 'readonly', s => s.get(key)),
    put: (store, key, val) => tx(store, 'readwrite', s => s.put(val, key)),
    del: (store, key) => tx(store, 'readwrite', s => s.delete(key)),
    keys: (store) => tx(store, 'readonly', s => s.getAllKeys()),
    all: (store) => tx(store, 'readonly', s => s.getAll()),
    count: (store, range) => tx(store, 'readonly', s => s.count(range)),
    putMany: (store, entries) => tx(store, 'readwrite', s => { entries.forEach(([k, v]) => s.put(v, k)); }),
    has: (store, key) => tx(store, 'readonly', s => s.count(key)),
    deletePrefix: (store, prefix) => tx(store, 'readwrite', s => s.delete(IDBKeyRange.bound(prefix, prefix + '\uffff'))),
  };

  window.Store = { load, save, idb };
})();
