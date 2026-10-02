/* Déclinaisons du logo Holdout à partir des fichiers sources de design/ :
     design/logo-holdout.png              logo complet sur fond crème (1254 × 1254)
     design/logo-holdout-transparent.png  logo complet sur fond transparent (1254 × 1254)
   Produit : emblème seul (couleurs d'origine et version claire pour fonds sombres), icônes d'application (web, installation,
   iOS), favicon, logo complet clair et foncé, aperçu de partage (site) et écrans de démarrage iOS.
   Usage : node tools/build-logo.mjs   (nécessite le module sharp : npm i --no-save sharp) */
import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'design/logo-holdout.png'), SRC_T = join(root, 'design/logo-holdout-transparent.png');
const CREAM = { r: 249, g: 247, b: 240, alpha: 1 }, LIGHT = [238, 242, 233];
// Emblème (boussole, montagne, feu) : carré centré sur la boussole, au-dessus du mot « HOLD OUT ».
const MARK = { left: 280, top: 140, width: 690, height: 690 };

/* Version claire pour fonds sombres : le vert foncé devient crème, l'or reste. */
async function lighten(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (data[i + 3] && lum < 120) [data[i], data[i + 1], data[i + 2]] = LIGHT;
  }
  return sharp(data, { raw: info }).png();
}
const markT = () => sharp(SRC_T).extract(MARK);
/* Icône opaque : emblème centré sur fond crème, occupant `ratio` du côté. */
async function icon(size, ratio, file) {
  const inner = Math.round(size * ratio), mark = await markT().resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: CREAM } }).composite([{ input: mark, gravity: 'center' }]).flatten({ background: CREAM }).png().toFile(file);
}
/* Logo complet centré sur un fond crème de taille donnée. */
async function poster(w, h, logoH, file) {
  const logo = await sharp(SRC).resize(logoH, logoH).png().toBuffer();
  await sharp({ create: { width: w, height: h, channels: 4, background: CREAM } }).composite([{ input: logo, gravity: 'center' }]).flatten({ background: CREAM }).png().toFile(file);
}

const out = [];
const save = async (p, f) => { await p; out.push(f.replace(root, '').replace(/\\/g, '/')); };
const I = f => join(root, 'icons', f);
await save(markT().resize(512, 512).png().toFile(I('logo-mark.png')), I('logo-mark.png'));
await save((await lighten(await markT().resize(512, 512).png().toBuffer())).toFile(I('logo-mark-light.png')), I('logo-mark-light.png'));
await save(sharp(SRC_T).resize(800, 800).png().toFile(I('logo-full.png')), I('logo-full.png'));
await save((await lighten(await sharp(SRC_T).resize(800, 800).png().toBuffer())).toFile(I('logo-full-light.png')), I('logo-full-light.png'));
await save(icon(512, 0.84, I('icon-512.png')), I('icon-512.png'));
await save(icon(192, 0.84, I('icon-192.png')), I('icon-192.png'));
await save(icon(512, 0.62, I('icon-maskable-512.png')), I('icon-maskable-512.png')); // zone sûre Android : cercle de 80 %
await save(icon(180, 0.84, I('apple-touch-icon.png')), I('apple-touch-icon.png'));
await save(icon(64, 0.9, I('favicon-64.png')), I('favicon-64.png'));
const ios = join(root, 'ios/App/App/Assets.xcassets');
await save(icon(1024, 0.8, join(ios, 'AppIcon.appiconset/AppIcon-512@2x.png')), join(ios, 'AppIcon.appiconset/AppIcon-512@2x.png'));
for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) await save(poster(2732, 2732, 1100, join(ios, 'Splash.imageset', f)), join(ios, 'Splash.imageset', f));
await save(poster(1200, 630, 600, join(root, 'site/og-image.png')), join(root, 'site/og-image.png'));
console.log('Logo décliné :\n  ' + out.join('\n  '));
