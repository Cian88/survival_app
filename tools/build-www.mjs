/* Assemble le dossier www/ embarqué dans l'application iOS (Capacitor) à partir des fichiers web du dépôt.
   Exclut documentation, outils, clés et fichiers de développement. */
import { cpSync, rmSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..'), out = join(root, 'www');
rmSync(out, { recursive: true, force: true }); mkdirSync(out);
for (const p of ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'lib', 'data', 'icons']) cpSync(join(root, p), join(out, p), { recursive: true });
// Runtime Capacitor (window.Capacitor, registerPlugin) — aussi versionné dans lib/ pour la version web.
const cap = join(root, 'node_modules/@capacitor/core/dist/capacitor.js');
if (existsSync(cap)) { copyFileSync(cap, join(out, 'lib/capacitor.js')); copyFileSync(cap, join(root, 'lib/capacitor.js')); }
console.log('www/ prêt');
