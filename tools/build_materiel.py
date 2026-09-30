"""Génère docs/MATERIEL.md à partir de js/gear.js (catalogue de l'application)."""
import json, re, collections, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'js/gear.js').read_text(encoding='utf-8')
G = json.loads(src[src.index('['):src.rindex(']') + 1])
eur = lambda v: f"{v:,.2f} €".replace(',', ' ').replace('.', ',')
tot = lambda items: sum((g['price_eur'] or 0) * (g['qty'] or 1) for g in items)
def tiers(pred):
    r = {}; acc = 0
    for t in ('essentiel', 'recommandé', 'optionnel'):
        acc += tot([g for g in G if pred(g) and g['priority'] == t]); r[t] = acc
    return r
sac, mai, mai_only = tiers(lambda g: g['scope'] != 'maison'), tiers(lambda g: g['scope'] != 'sac'), tiers(lambda g: g['scope'] == 'maison')
allt = tiers(lambda g: True)
w = sum((g['weight_g'] or 0) * (g['qty'] or 1) for g in G if g['scope'] != 'maison' and g['priority'] in ('essentiel', 'recommandé'))
nw = sum(1 for g in G if g['scope'] != 'maison' and g['priority'] in ('essentiel', 'recommandé') and not g['weight_g'])
est = [g for g in G if g['price_status'] != 'relevé']
out = []
A = out.append
A("# Liste du matériel, liens et récapitulatif budgétaire\n")
A(f"_Prix relevés le **{G[0]['source_date']}** : {len(G)} références, {len(G) - len(est)} prix relevés sur la page liée, {len(est)} estimations ({', '.join(g['name'] for g in est)}). Prix TTC en euros. Aucun lien n'est affilié. Les prix et les stocks changent : vérifiez avant d'acheter. Les modèles cités sont des exemples de référence et ne sont pas imposés._\n")
A("## Récapitulatif budgétaire (prix × quantité suggérée)\n")
A("Les paliers sont **cumulatifs**. « Sac » = objets à usage sac ou mixte (un exemplaire). « Maison » = objets à usage maison ou mixte. « Maison seule » exclut les objets mixtes déjà comptés dans le sac.\n")
A("| Palier | Sac d'évacuation (1 personne) | Maison (avec objets mixtes) | Maison seule | Tout le catalogue |")
A("|---|---:|---:|---:|---:|")
for t, lab in (('essentiel', 'Essentiel'), ('recommandé', '+ Recommandé'), ('optionnel', '+ Optionnel (tout)')):
    A(f"| {lab} | {eur(sac[t])} | {eur(mai[t])} | {eur(mai_only[t])} | {eur(allt[t])} |")
A("")
A(f"**Lecture rapide pour un foyer de N personnes** : environ `N × sac` + `maison seule`. Certains objets du sac peuvent être mutualisés (réchaud, filtre, radio, station électrique), ce qui réduit le total.\n")
A(f"**Poids du sac** (essentiel + recommandé, poids connus seulement) : **≈ {w/1000:.1f} kg".replace(".", ",") + f"**. C'est une borne basse, car {nw} objets n'ont pas de poids publié. Aucune norme officielle ne fixe le poids d'un sac d'évacuation : chargez-le et testez-le sur une vraie marche.\n")
A("Dans l'application, l'onglet **Matériel & budget** refait ces calculs selon **vos** choix (plan d'achat, objets déjà possédés, budget cible) et permet d'exporter le plan en CSV.\n")
A("### Par catégorie (tout le catalogue)\n")
A("| Catégorie | Nb | Essentiel | Tout |"); A("|---|---:|---:|---:|")
cats = collections.OrderedDict()
for g in G: cats.setdefault(g['category'], []).append(g)
for c, items in cats.items():
    A(f"| {c} | {len(items)} | {eur(tot([g for g in items if g['priority']=='essentiel']))} | {eur(tot(items))} |")
A("")
A("## Liste détaillée\n")
HOST = re.compile(r'^https?://(www\.)?')
def link(u): return '[' + HOST.sub('', u).split('/')[0] + '](' + u + ')'
for c, items in cats.items():
    A(f"### {c}\n")
    A("| Objet | Modèle de référence | Qté | Poids | Prix unitaire | Priorité | Usage | Lien |"); A("|---|---|---:|---:|---:|---|---|---|")
    for g in items:
        A(f"| {g['name']} | {g['model'] or ''} | {g['qty']} | {str(g['weight_g']) + ' g' if g['weight_g'] else '—'} | {eur(g['price_eur']) if g['price_eur'] else '—'}{'' if g['price_status']=='relevé' else ' *(estim.)*'} | {g['priority']} | {g['scope']} | {link(g['url'])} |")
    notes = [g for g in items if g.get('note')]
    if notes:
        A("")
        for g in notes: A(f"- **{g['name']}** : {g['note']}")
    A("")
A("""## Points de vigilance

- **Eau** : les filtres (Sawyer, Katadyn BeFree, LifeStraw) retiennent les bactéries et les protozoaires, **pas les virus** ni les produits chimiques. En zone urbaine ou après une inondation, **filtrer puis désinfecter** (recommandation du CDC). Le Micropur *Classic* (à l'argent) sert seulement à **conserver** une eau déjà potable.
- **Comprimés d'iode** : à prendre **uniquement sur ordre du préfet**. Selon l'ASNR, ils sont disponibles en pharmacie pour les habitants des zones PPI (20 km autour des centrales). Une campagne de distribution 0-20 km en septembre 2026 est annoncée par la presse spécialisée (Pharmactu). *Je ne peux pas la confirmer sur un site officiel.*
- **Radio** : les talkies-walkies **PMR446** homologués (ex. Motorola T42, Midland G7) s'utilisent sans licence. Émettre avec un émetteur-récepteur type Baofeng UV-5R demande une licence de radioamateur.
- **Garrot tourniquet** : il existe beaucoup de contrefaçons. Achetez chez un revendeur identifié et formez-vous (le guide SGDSN recommande la formation au garrot).
- **Groupe électrogène, réchaud, chauffage d'appoint** : à utiliser uniquement dehors ou dans une pièce aérée, avec un **détecteur de CO** (recommandé par le BBK).
- **Couteau** : en France, porter un couteau sans motif légitime est interdit. Gardez-le rangé dans le sac.
- **Rotation** : notez les dates sur les contenants (premier entré, premier sorti) et vérifiez le kit **deux fois par an** (guide SGDSN).
- **Sites évités** : le domaine `equipement-de-survie.fr`, qui ressort dans les moteurs de recherche, redirigeait le 30/09/2026 vers un site de casino. Il n'est pas utilisé ici.
- **Revendeurs non consultables** pendant le relevé (blocage anti-robot) : decathlon.fr, amazon.fr, leroymerlin.fr, fnac, darty, manomano, auvieuxcampeur… Ils restent de bonnes options : comparez vous-même.
- **passion-radio.fr** affiche ses prix HT. Pour les radios concernées, le TTC indiqué a été **calculé** (HT × 1,20).
""")
(root / 'docs/MATERIEL.md').write_text('\n'.join(out), encoding='utf-8')
print('ok', sac, mai_only, allt, w)
