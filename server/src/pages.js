/* Pages web ouvertes depuis les e-mails (confirmation d'adresse, nouveau mot de passe). */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function page(title, inner, status = 200) {
  return new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Holdout</title><meta name="robots" content="noindex">
<style>:root{color-scheme:light dark;--bg:#f5f6f2;--ink:#1d2a22;--muted:#5b6b60;--accent:#2f6b4f;--line:#d9ddd5}
@media (prefers-color-scheme:dark){:root{--bg:#15201b;--ink:#e8efe9;--muted:#9fb0a5;--accent:#7cc4a0;--line:#31443a}}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif}main{max-width:480px;margin:0 auto;padding:40px 16px}
h1{font-size:22px}p{color:var(--muted)}label{display:block;margin:14px 0 4px;font-weight:600}input{width:100%;box-sizing:border-box;padding:10px;border:1px solid var(--line);border-radius:8px;font:inherit;background:transparent;color:inherit}
button{margin-top:18px;width:100%;padding:12px;border:0;border-radius:8px;background:var(--accent);color:#fff;font:inherit;font-weight:600;cursor:pointer}button:disabled{opacity:.6}
.brand{font-weight:700;letter-spacing:.04em;color:var(--accent)}#msg{margin-top:14px}</style></head>
<body><main><div class="brand">HOLDOUT</div><h1>${esc(title)}</h1>${inner}</main></body></html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY' } });
}

/* Le nouveau mot de passe est transformé sur la page (même calcul que l'application, js/vault-crypto.js) :
   seule la clé de connexion dérivée part vers le serveur. */
export function resetForm(token, email) {
  return page('Nouveau mot de passe', `<p>Compte : <b>${esc(email)}</b></p>
<form id="f"><label for="p1">Nouveau mot de passe (10 caractères minimum)</label><input id="p1" type="password" minlength="10" required autocomplete="new-password">
<label for="p2">Confirmer</label><input id="p2" type="password" minlength="10" required autocomplete="new-password"><button id="b">Enregistrer</button></form><p id="msg" role="status"></p>
<script>
const email=${JSON.stringify(String(email).toLowerCase())}, token=${JSON.stringify(token)}, te=new TextEncoder();
const b64u=u=>btoa(String.fromCharCode(...new Uint8Array(u))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
async function authKey(pw){const s=crypto.subtle,k=await s.importKey('raw',te.encode(pw.normalize('NFKC')),'PBKDF2',false,['deriveBits']);
const m=await s.importKey('raw',await s.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:te.encode('holdout-password|'+email),iterations:600000},k,256),'HKDF',false,['deriveBits']);
return b64u(await s.deriveBits({name:'HKDF',hash:'SHA-256',salt:new Uint8Array(32),info:te.encode('holdout-auth')},m,256));}
document.getElementById('f').onsubmit=async e=>{e.preventDefault();const p1=document.getElementById('p1').value,p2=document.getElementById('p2').value,msg=document.getElementById('msg'),b=document.getElementById('b');
if(p1!==p2){msg.textContent='Les deux mots de passe ne correspondent pas.';return}
b.disabled=true;msg.textContent='Calcul de la clé…';
try{const r=await fetch('/auth/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,authKey:await authKey(p1)})});const j=await r.json();
if(!r.ok)throw new Error(j.error||'Échec');document.getElementById('f').remove();msg.innerHTML='<b>Mot de passe changé.</b> Dans l\\'application, connectez-vous avec le nouveau mot de passe : votre <b>code de secours</b> vous sera demandé une fois pour déverrouiller vos données chiffrées.';}
catch(err){msg.textContent=err.message;b.disabled=false}};
</script>`);
}
