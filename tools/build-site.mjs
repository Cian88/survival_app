/* Assemble le site hold-out.app dans dist-site/ :
   - pages de site/pages/ (accueil, confidentialité, conditions, mentions légales, aide, 404), avec en-tête et pied communs ;
   - l'application (dossier www/, assemblé par build-www.mjs) sous /app/.
   Mise en ligne : npm run deploy:site (Cloudflare, site/wrangler.json). */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..'), out = join(root, 'dist-site'), site = join(root, 'site');
const SITE = 'https://hold-out.app';

execFileSync(process.execPath, [join(root, 'tools/build-www.mjs')], { stdio: 'inherit' });
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
cpSync(join(root, 'www'), join(out, 'app'), { recursive: true });
copyFileSync(join(site, 'style.css'), join(out, 'style.css'));
copyFileSync(join(site, '_headers'), join(out, '_headers'));
copyFileSync(join(root, 'icons/icon.svg'), join(out, 'icon.svg'));
for (const f of ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png']) try { copyFileSync(join(root, 'icons', f), join(out, f)); } catch (e) { }

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const nav = `<header class="site-head"><div class="wrap">
  <a class="brand" href="/"><img src="/icon.svg" alt="" width="32" height="32"><span>holdout<span class="dot">.</span></span></a>
  <nav class="site-nav" aria-label="Navigation"><a href="/#fonctionnement">Fonctionnement</a><a href="/support/">Aide</a><a class="btn" href="/app/">Ouvrir l'application</a></nav>
</div></header>`;
const foot = `<footer class="site-foot"><div class="wrap">
  <nav aria-label="Informations"><a href="/support/">Aide et contact</a><a href="/confidentialite/">Confidentialité</a><a href="/conditions/">Conditions d'utilisation</a><a href="/mentions-legales/">Mentions légales</a><a href="mailto:contact@hold-out.app">contact@hold-out.app</a></nav>
  <p>Holdout est un outil d'aide à la préparation : il ne remplace ni les consignes des autorités ni les secours. En cas de danger, appelez le 112.</p>
  <p>© 2026 Holdout · Cartes © contributeurs OpenStreetMap</p>
</div></footer>`;
const pages = [];
for (const f of readdirSync(join(site, 'pages')).filter(f => f.endsWith('.html'))) {
  const src = readFileSync(join(site, 'pages', f), 'utf8'), m = /^<!--\s*(\{[\s\S]*?\})\s*-->/.exec(src);
  if (!m) throw new Error(f + ' : en-tête de page manquant');
  const meta = JSON.parse(m[1]), body = src.slice(m[0].length).trim();
  const url = SITE + '/' + meta.out.replace(/index\.html$/, '');
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
${meta.out === '404.html' ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<meta property="og:title" content="${esc(meta.title)}"><meta property="og:description" content="${esc(meta.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${url}">
<meta name="theme-color" content="#182c26">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<a class="skip" href="#contenu">Aller au contenu</a>
${nav}
<main id="contenu">
${body}
</main>
${foot}
</body>
</html>
`;
  mkdirSync(dirname(join(out, meta.out)), { recursive: true });
  writeFileSync(join(out, meta.out), html);
  if (meta.out !== '404.html') pages.push(url);
}
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`dist-site/ prêt : ${pages.length} pages + application sous /app/`);
