/* Génère docs/MATERIEL.md à partir du catalogue de l'application (js/gear.js) et des gammes de budget (js/gear-tiers.js).
   Lancer : node tools/build-materiel.mjs */
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.window = { KS_CONFIG: require('node:vm').runInNewContext(require('node:fs').readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + ';window.KS_CONFIG', { window: {} }) };
const TIERS = window.GEAR_TIERS = require('../js/gear-tiers.js');
require('../js/gear.js'); require('../js/env.js'); require('../js/shop.js');
const { GEAR, ENV_VARIANTS, Shop } = window, G = Shop.TIERS;

const eur = v => (Math.round(v * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/ /g, ' ') + ' €';
const price = (g, t) => { const o = Shop.offer(g.id, t); return o && !o.none ? o.price : 0; };
const total = (pred, t, prios) => GEAR.filter(g => pred(g) && prios.includes(g.priority)).reduce((a, g) => a + price(g, t) * (g.qty || 1), 0);
const sac = g => g.scope !== 'maison', maison = g => g.scope !== 'sac';
const P = [['Essentiel', ['essentiel']], ['+ Recommandé', ['essentiel', 'recommandé']], ['+ Optionnel (tout)', ['essentiel', 'recommandé', 'optionnel']]];
const cell = o => !o ? '—' : o.none ? '*' + o.none + '*' : `[${o.model.replace(/\|/g, '/')}](${o.url}) · ≈ ${eur(o.price)}${o.weight_g ? ' · ' + o.weight_g + ' g' : ''}`;
const out = [], A = s => out.push(s);
const date = TIERS.date.split('-').reverse().join('/');

A('# Matériel conseillé : 3 gammes de budget, liens Amazon.fr\n');
A(`_${GEAR.length} objets au catalogue, chacun en 3 gammes (petit budget, budget moyen, gros budget), plus ${ENV_VARIANTS.reduce((a, e) => a + (e.add || []).length, 0)} ajouts selon l'environnement. Prix **indicatifs du marché estimés le ${date}** (TTC) : le prix réel s'affiche sur Amazon. Les liens sont des recherches Amazon.fr ciblées (marque + modèle)${window.KS_CONFIG.amazon && window.KS_CONFIG.amazon.tag ? ', avec le tag Partenaires Amazon' : ', sans affiliation pour l\'instant (voir [AMAZON.md](AMAZON.md))'}. Fichier généré par \`node tools/build-materiel.mjs\` : ne pas le modifier à la main._\n`);
A('## Récapitulatif budgétaire (prix indicatif × quantité suggérée)\n');
A('Paliers **cumulatifs**. « Sac » = objets à usage sac ou mixte (un exemplaire, 1 personne). « Maison » = objets à usage maison ou mixte.\n');
A('| Palier | ' + G.map(t => `Sac — ${t.label.toLowerCase()}`).join(' | ') + ' | ' + G.map(t => `Maison — ${t.label.toLowerCase()}`).join(' | ') + ' |');
A('|---|' + '---:|'.repeat(6));
for (const [lab, pr] of P) A(`| ${lab} | ${G.map(t => eur(total(sac, t.id, pr))).join(' | ')} | ${G.map(t => eur(total(maison, t.id, pr))).join(' | ')} |`);
A('\nDans l\'application, la gamme se choisit à la création de chaque sac (et pour la maison dans Mon profil ou Matériel & budget) ; elle reste modifiable. Le petit budget couvre les mêmes besoins, avec du matériel en général plus lourd ou moins durable.\n');

A('## Liste détaillée\n');
const cats = {}; for (const g of GEAR) (cats[g.category] = cats[g.category] || []).push(g);
for (const [c, items] of Object.entries(cats)) {
  A(`### ${c}\n`);
  A('| Objet | Qté | Priorité | Usage | ' + G.map(t => t.short + ' ' + t.label).join(' | ') + ' |'); A('|---|---:|---|---|---|---|---|');
  for (const g of items) A(`| ${g.name}${g.tip ? '<br>*' + g.tip.replace(/\|/g, '/') + '*' : ''} | ${g.qty} | ${g.priority} | ${g.scope} | ${G.map(t => cell(Shop.offer(g.id, t.id))).join(' | ')} |`);
  A('');
}
A('## Ajouts selon l\'environnement\n');
for (const e of ENV_VARIANTS) {
  if (!(e.add || []).length) continue;
  A(`### ${e.name}\n`);
  A('| Objet | Priorité | ' + G.map(t => t.short + ' ' + t.label).join(' | ') + ' |'); A('|---|---|---|---|---|');
  e.add.forEach((a, i) => A(`| ${a.item.replace(/\|/g, '/')} | ${a.priority || ''} | ${G.map(t => cell(Shop.offer(e.id + ':' + i, t.id))).join(' | ')} |`));
  A('');
}
A(`## Provenance des prix

- **Gammes** (js/gear-tiers.js) : modèles et prix indicatifs établis le ${date} par recherche web (sites de marques, comparatifs, revendeurs) ; Amazon.fr bloque la consultation automatique, donc ni la disponibilité ni le prix exact n'y ont été vérifiés produit par produit. Les marques vendues seulement en magasin propre (Decathlon : Quechua, Forclaz…) sont exclues, car absentes d'Amazon.
- **Quand l'API Amazon sera active** (après les premières ventes du compte Partenaires, voir [AMAZON.md](AMAZON.md)), l'application affichera les prix officiels datés à la place des estimations.
- **Catalogue d'origine** (js/gear.js, champs \`url\` et \`note\`) : prix relevés le 30/09/2026 chez des revendeurs spécialisés. Ces liens ne sont plus affichés dans l'application ; ils restent la trace de la première estimation.

## Points de vigilance

- **Eau** : les filtres (Sawyer, Katadyn BeFree, LifeStraw) retiennent les bactéries et les protozoaires, **pas les virus** ni les produits chimiques. En zone urbaine ou après une inondation, **filtrer puis désinfecter** (recommandation du CDC). Le Micropur *Classic* (à l'argent) sert seulement à **conserver** une eau déjà potable.
- **Comprimés d'iode** : médicament à retirer en pharmacie, à prendre **uniquement sur ordre du préfet** ; aucun lien d'achat n'est proposé.
- **Radio** : les talkies-walkies **PMR446** homologués s'utilisent sans licence. Émettre avec un émetteur-récepteur type Baofeng UV-5R demande une licence de radioamateur.
- **Garrot tourniquet** : beaucoup de contrefaçons circulent, y compris sur les places de marché. Les trois gammes proposent des modèles homologués CoTCCC : achetez chez le vendeur officiel de la marque et formez-vous.
- **Groupe électrogène, réchaud, chauffage d'appoint** : uniquement dehors ou dans une pièce aérée, avec un **détecteur de CO**.
- **Couteau** : en France, porter un couteau sans motif légitime est interdit. Gardez-le rangé dans le sac.
- **Rotation** : notez les dates sur les contenants (premier entré, premier sorti) et vérifiez le kit **deux fois par an** (guide SGDSN).
`);
writeFileSync(new URL('../docs/MATERIEL.md', import.meta.url), out.join('\n'));
console.log('docs/MATERIEL.md :', out.length, 'lignes');
