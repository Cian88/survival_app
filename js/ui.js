/* Fenêtres de dialogue intégrées à la page (remplacent prompt/confirm/alert,
   bloqués dans certains contextes comme les Artifacts Claude). */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let dialogId = 0;
  // Keep keyboard navigation inside a dialog, then return to the initiating control.
  function dialogSession(wrap) {
    const previous = document.activeElement;
    const background = [...document.body.children].filter(el => el !== wrap && el.tagName !== 'SCRIPT' && !el.inert);
    background.forEach(el => { el.inert = true; });
    const trap = e => {
      if (e.key !== 'Tab') return;
      const controls = [...wrap.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')]
        .filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
      if (!controls.length) { e.preventDefault(); return; }
      const first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && (document.activeElement === first || !wrap.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !wrap.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    };
    wrap.addEventListener('keydown', trap);
    let closed = false;
    return () => {
      if (closed) return;
      closed = true;
      wrap.removeEventListener('keydown', trap);
      wrap.remove();
      background.forEach(el => { el.inert = false; });
      if (previous && previous.isConnected && !previous.closest('[inert]')) previous.focus({ preventScroll: true });
    };
  }
  function open(html, onReady) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(wrap);
    const dialog = wrap.firstElementChild, heading = dialog.querySelector('h3, h2, p');
    if (heading) { heading.id = 'uiDialogTitle' + (++dialogId); dialog.setAttribute('aria-labelledby', heading.id); }
    const close = dialogSession(wrap);
    // Escape belongs to this dialog; it must not also exit the map beneath it.
    wrap.addEventListener('keydown', e => { if (e.key === 'Escape') e.stopPropagation(); });
    onReady(wrap, close);
    const first = wrap.querySelector('input, textarea, button.btn');
    if (first) first.focus();
    return wrap;
  }
  const UI = {
    dialogSession,
    preserveFocus(root, render) {
      const active = document.activeElement;
      const restore = root && active && root.contains(active);
      const attributes = restore ? [...active.attributes].filter(a => a.name === 'id' || a.name === 'name' || a.name.startsWith('data-')) : [];
      const start = restore ? active.selectionStart : null, end = restore ? active.selectionEnd : null;
      render();
      if (!restore || active.isConnected) return;
      const next = attributes.length && [...root.querySelectorAll(active.tagName)].find(el => attributes.every(a => el.getAttribute(a.name) === a.value));
      if (!next) { root.focus({ preventScroll: true }); return; }
      next.focus({ preventScroll: true });
      if (start != null && typeof next.setSelectionRange === 'function') next.setSelectionRange(start, end);
    },
    icon(name, cls = '') {
      const paths = {
        compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5Z"/>',
        now: '<path d="m13 2-8 12h6l-1 8 9-12h-6Z"/>',
        audit: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h4"/>',
        map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2ZM9 3v16M15 5v16"/>',
        profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
        bag: '<rect x="5" y="6" width="14" height="16" rx="4"/><path d="M9 6V4a3 3 0 0 1 6 0v2M5 12h14M9 16h6"/>',
        home: '<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',
        field: '<path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1ZM12 5v15"/>',
        calc: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h2M14 19h2"/>',
        gear: '<path d="m12 2 9 5v10l-9 5-9-5V7ZM3 7l9 5 9-5M12 12v10M7 4.8l9 5"/>',
        plan: '<path d="M4 22V3m0 1c6-5 10 5 16 0v11c-6 5-10-5-16 0"/>',
        notice: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
        settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--panel)"/><circle cx="15" cy="17" r="3" fill="var(--panel)"/>',
        moon: '<path d="M20.5 13A9 9 0 0 1 11 3.5 9 9 0 1 0 20.5 13Z"/>',
        system: '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8M12 16v5"/>',
        premium: '<path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
        more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
        arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
        back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
        close: '<path d="m6 6 12 12M6 18 18 6"/>',
        locate: '<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
        layers: '<path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
        water: '<path d="M12 2C9 7 5 10 5 15a7 7 0 0 0 14 0c0-5-4-8-7-13Z"/>',
        food: '<path d="M5 2v7m4-7v7M3 2v4a4 4 0 0 0 8 0V2M7 10v12M20 2c-4 2-5 7-5 11h5M20 2v20"/>',
        cash: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/>',
        shield: '<path d="m12 2 9 4v6c0 5-5 8-9 10-4-2-9-5-9-10V6ZM8 12l3 3 5-6"/>',
        flame: '<path d="M12 2c0 7-7 6-7 13a7 7 0 0 0 14 0c0-4-2-7-4-9 0 4-2 4-3 5 1-4 1-6 0-9Z"/>',
        waves: '<path d="M2 6c4-5 6 5 10 0s6 5 10 0M2 12c4-5 6 5 10 0s6 5 10 0M2 18c4-5 6 5 10 0s6 5 10 0"/>',
        snow: '<path d="M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3M9 20l3-3 3 3M3 11l4-1-1-4M18 18l-1-4 4-1M3 13l4 1-1 4M18 6l-1 4 4 1"/>',
        sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
        hazard: '<path d="m12 3 10 18H2ZM12 9v5M12 17h.01"/>',
        medical: '<path d="M8 3h8v5h5v8h-5v5H8v-5H3V8h5Z"/>',
        phone: '<path d="m7 3 3 5-3 3c2 3 3 4 6 6l3-3 5 3c0 4-3 5-6 4C8 19 5 16 3 9 2 6 3 3 7 3Z"/>',
      };
      return `<svg class="ui-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.compass}</svg>`;
    },
    /* fields : [{ name, label, value, type }] → Promise<objet | null> */
    ask(title, fields, okLabel = 'Valider') {
      return new Promise(resolve => open(`
        <form>
          <h3>${esc(title)}</h3>
          ${fields.map((f, i) => `<label class="field" for="uiF${i}">${esc(f.label)}</label>
            <input id="uiF${i}" name="${esc(f.name)}" type="${f.type || 'text'}" value="${esc(f.value ?? '')}" ${f.required ? 'required' : ''}>`).join('')}
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
    /* Choix parmi de grandes options : [{ id, title, sub, detail }] → Promise<id | null>. intro : HTML de confiance. */
    choose(title, intro, options, preselect) {
      return new Promise(resolve => open(`
        <h3>${esc(title)}</h3>${intro ? `<p class="small">${intro}</p>` : ''}
        <div class="choices">${options.map(o => `<button class="choice ${o.id === preselect ? 'on' : ''}" data-id="${esc(o.id)}"><b>${esc(o.title)}</b>${o.sub ? `<span class="choice-sub">${esc(o.sub)}</span>` : ''}${o.detail ? `<span class="small muted">${esc(o.detail)}</span>` : ''}</button>`).join('')}</div>
        <div class="row end"><button class="btn ghost" data-x>Annuler</button></div>`, (w, close) => {
        w.querySelector('[data-x]').onclick = () => { close(); resolve(null); };
        w.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { close(); resolve(b.dataset.id); });
        w.addEventListener('keydown', e => { if (e.key === 'Escape') { close(); resolve(null); } });
        const pre = w.querySelector('.choice.on'); if (pre) setTimeout(() => pre.focus());
      }));
    },
    notice(msg) {
      return new Promise(resolve => open(`<p>${esc(msg)}</p><div class="row end"><button class="btn" data-ok>OK</button></div>`, (w, close) => {
        w.querySelector('[data-ok]').onclick = () => { close(); resolve(); };
        w.addEventListener('keydown', e => { if (e.key === 'Escape') { close(); resolve(); } });
      }));
    },
    /* Affiche un contenu à copier quand le téléchargement direct est bloqué */
    showText(title, text) {
      open(`<h3>${esc(title)}</h3><p class="small muted">Si le téléchargement n'a pas démarré (certains contextes le bloquent), copiez le contenu ci-dessous dans un fichier.</p>
        <textarea readonly id="uiText" aria-label="${esc(title)}" style="min-height:220px">${esc(text)}</textarea>
        <div class="row end"><button class="btn ghost" data-copy>Copier</button><button class="btn" data-ok>Fermer</button></div>`, (w, close) => {
        w.querySelector('[data-ok]').onclick = close;
        w.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
        w.querySelector('[data-copy]').onclick = e => {
          const ta = w.querySelector('textarea');
          const done = () => { e.target.textContent = 'Copié'; };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => { ta.select(); document.execCommand('copy'); done(); });
          else { ta.select(); document.execCommand('copy'); done(); }
        };
      });
    },
  };
  /* Tableaux sur téléphone : chaque ligne devient une fiche (css/app.css, « table.stack »).
     Les libellés viennent de la ligne d'en-têtes ; la case à cocher et la colonne principale forment le titre de la fiche.
     Sans ligne d'en-têtes (petits tableaux à deux colonnes), le tableau reste tel quel. */
  function stackTables(root) {
    for (const t of root.querySelectorAll('table:not(.tags):not([data-stacked])')) {
      const head = [...t.rows].find(r => r.cells.length && [...r.cells].every(c => c.tagName === 'TH'));
      if (!head) continue;
      const labels = []; for (const c of head.cells) for (let i = 0; i < (c.colSpan || 1); i++) labels.push(c.textContent.trim());
      head.classList.add('stack-head');
      for (const c of head.cells) c.scope = 'col';
      for (const r of t.rows) {
        if (r === head) continue;
        if (r.cells.length === 1 && r.cells[0].colSpan > 1) { r.cells[0].classList.add('td-full'); continue; }
        let col = 0, main = false;
        for (const c of r.cells) {
          const label = labels[col] || '', box = c.querySelector('input[type=checkbox]') && !c.textContent.trim();
          if (label && label !== '✓') c.dataset.label = label;
          if (box) c.classList.add('td-check');
          else if (!main && label && label !== '✓' && !c.classList.contains('num')) { c.classList.add('td-main'); main = true; }
          else if (!label && c.querySelector('button, a')) c.classList.add('td-act');
          col += c.colSpan || 1;
        }
      }
      t.classList.add('stack'); t.dataset.stacked = '1';
    }
  }
  UI.stackTables = stackTables;
  // Les écrans sont reconstruits à chaque modification : on repasse sur les nouveaux tableaux.
  const main = document.getElementById('main');
  /* Panneaux dépliables (<details>) : un écran reconstruit repartirait de son HTML (un panneau écrit « open » se
     rouvrirait à chaque case cochée). On mémorise l'état choisi par l'utilisateur et on le rétablit avant l'affichage.
     Clé : écran, sac ou pilier, classe et titre du panneau (sans les compteurs, qui changent). */
  const detailsState = new Map();
  const detailsKey = d => {
    const s = d.querySelector(':scope > summary'), host = d.closest('[data-bag], [data-pillar]'), tab = d.closest('.tab');
    return [tab && tab.id, host && (host.dataset.bag || host.dataset.pillar), d.className, s ? s.textContent.replace(/[\d/%]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) : ''].join('|');
  };
  document.addEventListener('toggle', e => { const d = e.target; if (d.tagName === 'DETAILS' && d.isConnected) detailsState.set(detailsKey(d), d.open); }, true);
  function restoreDetails(root) {
    if (!detailsState.size) return;
    for (const d of root.querySelectorAll('details')) { const v = detailsState.get(detailsKey(d)); if (v != null && d.open !== v) d.open = v; }
  }
  let pending = false;
  if (main) new MutationObserver(() => {
    restoreDetails(main);
    if (pending) return; pending = true;
    requestAnimationFrame(() => { pending = false; stackTables(main); });
  }).observe(main, { childList: true, subtree: true });
  window.UI = UI;
})();
