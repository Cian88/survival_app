/* Fenêtres de dialogue intégrées à la page (remplacent prompt/confirm/alert,
   bloqués dans certains contextes comme les Artifacts Claude). */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function open(html, onReady) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(wrap);
    const close = () => wrap.remove();
    onReady(wrap, close);
    const first = wrap.querySelector('input, textarea, button.btn');
    if (first) first.focus();
    return wrap;
  }
  const UI = {
    /* fields : [{ name, label, value, type }] → Promise<objet | null> */
    ask(title, fields, okLabel = 'Valider') {
      return new Promise(resolve => open(`
        <form>
          <h3>${esc(title)}</h3>
          ${fields.map((f, i) => `<label class="field" for="uiF${i}">${esc(f.label)}</label>
            <input id="uiF${i}" name="${esc(f.name)}" type="${f.type || 'text'}" value="${esc(f.value || '')}" ${f.required ? 'required' : ''}>`).join('')}
          <div class="row end"><button type="button" class="btn ghost" data-x>Annuler</button><button class="btn">${esc(okLabel)}</button></div>
        </form>`, (w, close) => {
        w.querySelector('[data-x]').onclick = () => { close(); resolve(null); };
        w.querySelector('form').onsubmit = e => { e.preventDefault(); const o = Object.fromEntries(new FormData(e.target).entries()); close(); resolve(o); };
        w.addEventListener('keydown', e => { if (e.key === 'Escape') { close(); resolve(null); } });
      }));
    },
    confirm(msg, okLabel = 'Confirmer', danger = true) {
      return new Promise(resolve => open(`
        <p>${esc(msg)}</p>
        <div class="row end"><button class="btn ghost" data-x>Annuler</button><button class="btn ${danger ? 'bad' : ''}" data-ok>${esc(okLabel)}</button></div>`, (w, close) => {
        w.querySelector('[data-x]').onclick = () => { close(); resolve(false); };
        w.querySelector('[data-ok]').onclick = () => { close(); resolve(true); };
        w.addEventListener('keydown', e => { if (e.key === 'Escape') { close(); resolve(false); } });
      }));
    },
    notice(msg) {
      return new Promise(resolve => open(`<p>${esc(msg)}</p><div class="row end"><button class="btn" data-ok>OK</button></div>`, (w, close) => {
        w.querySelector('[data-ok]').onclick = () => { close(); resolve(); };
      }));
    },
    /* Affiche un contenu à copier quand le téléchargement direct est bloqué */
    showText(title, text) {
      open(`<h3>${esc(title)}</h3><p class="small muted">Si le téléchargement n'a pas démarré (certains contextes le bloquent), copiez le contenu ci-dessous dans un fichier.</p>
        <textarea readonly id="uiText" style="min-height:220px">${esc(text)}</textarea>
        <div class="row end"><button class="btn ghost" data-copy>Copier</button><button class="btn" data-ok>Fermer</button></div>`, (w, close) => {
        w.querySelector('[data-ok]').onclick = close;
        w.querySelector('[data-copy]').onclick = e => {
          const ta = w.querySelector('textarea');
          const done = () => { e.target.textContent = 'Copié'; };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => { ta.select(); document.execCommand('copy'); done(); });
          else { ta.select(); document.execCommand('copy'); done(); }
        };
      });
    },
  };
  window.UI = UI;
})();
