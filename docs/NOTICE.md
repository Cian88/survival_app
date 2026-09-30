# Notice d'utilisation — Kit Survie Europe

> Outil d'aide à la préparation. Il ne remplace ni les consignes des autorités (préfecture, secours), ni une formation aux premiers secours.
> Toutes vos données restent sur votre appareil (navigateur). Rien n'est envoyé à un serveur.

## 1. Installation et usage hors ligne

| Méthode | Comment | Hors ligne ? |
|---|---|---|
| **Serveur local (recommandé)** | Linux/macOS : `./lancer.sh` — Windows : double-clic sur `lancer.bat` (Python 3 requis), puis ouvrir `http://localhost:8765` | Oui, après le premier chargement : le *service worker* met toute l'application en cache ; vous pouvez l'installer (menu du navigateur → « Installer l'application »). |
| **Hébergement web** (ex. GitHub Pages) | Publier le dépôt, ouvrir l'URL sur téléphone, « Ajouter à l'écran d'accueil » | Oui, après le premier chargement. |
| **Double-clic sur `index.html`** | Ouvre le fichier directement | Oui pour l'application et la carte intégrée ; pas d'installation possible, et le stockage dépend du navigateur. |

**Conseil** : copiez aussi le dossier complet sur une clé USB et sur un deuxième appareil (téléphone + ordinateur).

## 2. Onglets

1. **Tableau de bord** : réglez le foyer (adultes, enfants, animaux), la durée d'autonomie visée et les repères d'eau et de calories. Les indicateurs (eau, nourriture, piliers, sacs, budget, prochaine vérification) et les alertes se mettent à jour automatiquement.
2. **Écosystème maison** : besoins calculés, **inventaire** (litres, kcal, date de péremption, emplacement) et les **9 piliers** (eau, nourriture, énergie/chaleur/lumière, santé, hygiène, communication, documents/argent, sécurité/outils, plan/savoirs/entraide). Chaque pilier indique ses sources.
3. **Sac d'évacuation** : un sac par personne. « Pré-remplir : essentiels » ajoute les objets essentiels du catalogue. Ajustez les quantités, poids et prix, et cochez ce que vous possédez. Poids et coût restant sont calculés.
4. **Matériel & budget** : catalogue filtrable avec liens, prix indicatifs, paliers de budget (essentiel → recommandé → optionnel), plan d'achat maison et export CSV.
5. **Carte** : voir §3.
6. **Plan & scénarios** : contacts, vérification semestrielle, plan familial, PIMS et réflexes par scénario (alerte, nucléaire, inondation, feu, attentat, coupure, évacuation, hypothermie, arrêt cardiaque).
7. **Notice & infos** : numéros d'urgence, signal d'alerte, radio, traitement de l'eau, synthèse de la chaîne *Apprendre Préparer (Sur)vivre*, notice, sauvegarde et sources.

## 3. La carte hors ligne

### Couches intégrées (aucune connexion nécessaire)
- **Relief Europe intégré** : image ombrée et colorée par altitude, calculée à partir des tuiles d'altitude *Terrain Tiles* (zoom 7, environ 1 km par pixel). Au-delà du zoom 8, l'image devient floue : utilisez le relief détaillé.
- **Fond vectoriel** (Natural Earth) : pays, frontières, fleuves, lacs, routes principales (visibles à partir du zoom 6) et villes.
- **Sites nucléaires** (Wikidata), avec un cercle de rayon réglable (20 km par défaut, soit le rayon des PPI français depuis 2019-2020, source ASNR). Le statut vient de Wikidata et n'est pas toujours renseigné : les sites « désaffectés » peuvent encore contenir des matières radioactives.
- **Grands barrages** (hauteur ≥ 50 m renseignée dans Wikidata ; la liste n'est **pas exhaustive**).
- **Centrales électriques ≥ 50 MW hors nucléaire** (WRI Global Power Plant Database, données 2021, donc certaines centrales peuvent avoir fermé).

### À télécharger AVANT une coupure (par zone)
1. Centrez la carte sur votre zone (domicile, travail, école, famille, itinéraires d'évacuation).
2. **Relief détaillé** : choisissez les zooms, vérifiez l'estimation (au maximum 5 000 tuiles par lot, environ 60 Ko par tuile), puis cliquez sur « Télécharger le relief ». La couche « Relief MNT détaillé » et l'altitude au clic fonctionneront ensuite hors ligne.
3. **Points OSM** (zoom ≥ 9) : cochez les catégories (eau, santé, secours/abris, énergie, dangers, ravitaillement), puis téléchargez et nommez la zone. Les points sont stockés sur l'appareil.
   - ⚠ Une fontaine ou une source cartographiée n'est pas forcément potable : traitez l'eau.
4. Recommencez pour chaque zone utile. « Stockage & sources » indique l'espace utilisé. L'application demande au navigateur un stockage persistant.

### Mes points
Ajoutez vos points de rendez-vous, caches, refuges, points d'eau vérifiés et dangers. Vous pouvez les exporter en **GPX** (pour un GPS ou une application de randonnée) ou en **GeoJSON**, et les importer depuis ces deux formats.

### Outils
- **Ma position** : GPS du téléphone, fonctionne sans Internet.
- **Mesurer** : distance cumulée et temps de marche indicatif à 4 km/h sur terrain plat, sans compter le dénivelé.
- **Clic sur la carte** : coordonnées décimales et en degrés-minutes-secondes, et altitude.

### OpenTopoMap (en ligne)
Carte topographique détaillée (courbes de niveau, sentiers). Pour respecter ce service bénévole, l'application **ne propose pas de téléchargement en masse** : seules les tuiles que vous consultez sont conservées en cache. Pour une carte détaillée hors ligne, utilisez un fichier PMTiles.

### Carte détaillée de toute l'Europe hors ligne (PMTiles)
Protomaps publie chaque jour un fond de carte OpenStreetMap mondial au format PMTiles (licences BSD / ODbL), qu'on peut découper :

1. Téléchargez l'outil `pmtiles` : https://github.com/protomaps/go-pmtiles/releases
2. Choisissez une version récente sur https://maps.protomaps.com/builds/
3. Extrayez l'Europe (ou votre région), en limitant le zoom maximal :
   ```
   pmtiles extract https://build.protomaps.com/AAAAMMJJ.pmtiles europe.pmtiles --bbox=-25,34,45,72 --maxzoom=12
   ```
   La taille du fichier augmente très vite avec `--maxzoom`. Ajoutez `--dry-run` pour connaître la taille avant de télécharger. Pour une région seulement, réduisez la `--bbox`.
4. Dans la carte, ouvrez « Carte détaillée hors ligne » et choisissez le fichier. Il doit être rechargé à chaque ouverture de l'application, car le navigateur ne peut pas le relire seul.

Les fichiers PMTiles *raster* (images) sont aussi acceptés.

**Et le papier** : gardez des **cartes papier** (IGN TOP 25 / TOP 100 ou équivalent) et une **boussole**. La Suède (MSB) les recommande explicitement pour l'évacuation.

## 4. Sauvegarde

- **Notice & infos → Exporter mes données (JSON)** : sauvegarde complète (profil, inventaire, sacs, plan, contacts, points). Gardez-en une copie sur une clé USB.
- Si vous effacez les données du navigateur (cookies et données de site), vous perdez les données locales **et** les cartes téléchargées.
- Imprimez le plan familial et les contacts, car le papier fonctionne sans batterie.

## 5. Entretien (rythme recommandé : 2 fois par an, guide SGDSN)
- Dates de péremption : eau, nourriture, médicaments. Consommez ce qui arrive à échéance et remplacez-le (rotation).
- Piles, batteries et powerbanks : rechargez-les.
- Vêtements : adaptez-les à la saison et à la taille des enfants.
- Papiers : mettez les copies à jour.
- Mettez à jour les zones de carte si vous avez déménagé.
- Cliquez sur « Vérification faite aujourd'hui » (onglet Plan) pour recalculer la prochaine échéance.

## 6. Informations importantes (voir aussi l'onglet Notice & infos)

- **112** : urgence européenne. **15** SAMU, **18** pompiers, **17** police, **114** urgence par SMS, **196** urgence en mer.
- **Sirène d'alerte (France)** : 3 séquences de 1 min 41 s séparées par 5 s de silence. Fin d'alerte : son continu de 30 s. Test le 1er mercredi du mois.
- **Radio** : Ici (ex-France Bleu), France Info et France Inter (convention d'alerte avec le ministère de l'Intérieur, 15/10/2025).
- **Comprimés d'iode** : à prendre **uniquement sur ordre du préfet**.
- **Eau** : faire bouillir 1 min (3 min au-dessus d'environ 2 000 m). Filtrer puis désinfecter. Ne pas utiliser la dose américaine d'eau de Javel (5-9 %) avec la Javel française à 2,6 % sans l'ajuster.

Toutes les références sont dans [`SOURCES.md`](SOURCES.md).
