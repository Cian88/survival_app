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

## 2. Principe : une application construite autour de vous

L'application tourne autour de **votre** situation : votre foyer, votre logement, votre environnement, **votre** matériel. L'objectif est de pouvoir réagir **à l'instant T**, même sans Internet.

1. **Mon profil** (à remplir en premier) : adultes, enfants, nourrissons, animaux ; santé (traitement chronique, appareil médical électrique, lunettes, mobilité) ; logement (type, étage, chauffage, cuisson, eau du réseau ou d'un puits, véhicule) ; **position du domicile** (GPS ou coordonnées) ; lieu et climat ; objectifs ; compétences.
2. **État des lieux** : les besoins sont calculés d'après le profil et comparés à ce que vous avez. Exemples : 4 L d'eau/pers/j × jours visés (× 1,5 par temps chaud) ; comprimés d'iode si le domicile est à moins de 20 km d'un site nucléaire ; moyen de puiser sans électricité si vous avez un puits ; plan « une pièce chaude » si votre chauffage dépend du courant. S'y ajoutent les essentiels de votre lieu et de votre climat.
   - Statut de chaque besoin : ✓ couvert, ◐ partiel, ✗ manquant, – sans objet. Niveau : vital, important ou utile.
   - Certains points se remplissent seuls : l'inventaire (eau, calories), les sacs cochés, les achats cochés, les contacts, le point de rendez-vous, la carte hors ligne et les points OSM de la zone du domicile.
   - « Liste de courses des manques (CSV) » exporte ce qu'il reste à acquérir, avec les liens.
3. **Carte hors ligne** : voir §3.
4. **Instant T** : l'écran à ouvrir quand ça arrive.
   - **Me localiser** : GPS du téléphone, qui fonctionne sans Internet.
   - Autonomie réelle : jours d'eau et de nourriture, sacs prêts, espèces.
   - Choix de la situation parmi 11 : coupure de courant ou d'eau, crue, grand froid, canicule, feu, alerte nucléaire ou chimique, évacuation, blessé, séisme, perdu.
   - Pour chaque situation : actions immédiates à cocher (sourcées), matériel **que vous avez** et ce qui manque, ressources et dangers les plus proches d'après vos données hors ligne (distance et cap), direction du domicile et des points de rendez-vous, numéros d'urgence et vos contacts.
5. **Sacs** : deux types, pour deux usages.
   - **Sac d'évacuation** : rejoindre vite un lieu sûr (proches, hébergement), de 24 h à 7 jours, le plus souvent en ville ou en voiture. Priorités : papiers, espèces, médicaments, eau, chargeur, vêtements. Sac discret, sans arme.
   - **Sac de survie** : tenir en autonomie en pleine nature, de 24 h à 14 jours. Contenu : abri, feu, eau à traiter, gamelle qui va au feu, orientation, outils (les « 10 C » de Dave Canterbury).
   - **Sélecteur d'autonomie** (24 h, 48 h, 72 h, 5, 7, 10 ou 14 jours) : les consommables marqués « auto » se recalculent. C'est le cas de l'eau portée (1 L/jour, 3 L au plus), des pastilles, des rations (kcal du profil), des repas lyophilisés, des cartouches de gaz, des lingettes, des chaussettes et des médicaments. Le panneau solaire s'ajoute à partir de 5 jours. Chaque règle affiche sa base ; « hypothèse » signale un choix sans source chiffrée. Si vous modifiez une quantité à la main, elle n'est plus recalculée.
   - Variantes selon le lieu et le climat.
6. **Stock maison** : durée d'autonomie visée (3 à 90 jours), inventaire daté (litres, kcal, péremption) et 9 piliers. La durée recalcule aussi les achats « maison » marqués « auto » : jerricans (personnes × jours × L/jour ÷ 20 L), pastilles, papier toilette, sacs, cartouches de gaz.
7. **Terrain** : ce que disent les praticiens, les forums et les témoins de crises réelles.
8. **Calculateurs** : eau, dose de Javel selon votre flacon, batterie, solaire, eau de pluie, poids du sac, temps de marche, stock profond, gaz par temps froid.
9. **Matériel & budget**, **Plan & scénarios**, **Notice**.
10. **★ Premium** : offres (3,90 €/mois, 29,90 €/an, 59,90 € à vie) et activation d'une clé de licence, vérifiée sur l'appareil sans Internet. Tout ce qui sert en urgence reste gratuit. Le détail est dans [`MONETISATION.md`](MONETISATION.md).

## 3. La carte hors ligne

### Cartes topographiques hors ligne : l'essentiel
1. Renseignez votre domicile dans **Mon profil**.
2. Ouvrez **Carte hors ligne → 📥 Cartes hors ligne**, puis choisissez :
   - **Zone** : autour du domicile, autour de votre position GPS, ou la zone affichée.
   - **Rayon** : de 5 à 50 km.
   - **Détail max** : le zoom 14 correspond environ à l'échelle 1:25 000, le zoom 15 au détail randonnée.
3. Choisissez les sources :
   - **IGN Plan topographique** (France) : carte officielle de l'IGN, avec routes, chemins, courbes de niveau et lieux-dits.
   - **IGN Estompage** (France) : ombrage du relief, superposé au plan.
   - **Relief et altitudes** (toute l'Europe) : utile hors de France et pour l'altitude au clic.
4. Vérifiez l'estimation de taille, puis téléchargez. Le pack reste sur l'appareil. Ajoutez d'autres packs pour le travail, la famille et vos itinéraires.
5. Hors ligne, choisissez le fond **« IGN topographique – France (packs hors ligne) »**. Si vous zoomez au-delà du détail téléchargé, l'application agrandit la tuile disponible, ce qui donne une image plus floue mais toujours lisible.
6. **Exporter** un pack crée un fichier `.kspack` à copier sur une clé USB ou un autre appareil ; on le réimporte avec « Importer un pack ».

**Cartes IGN officielles : ce qui est accessible.**
- Depuis le 1er janvier 2021, les données publiques de l'IGN sont gratuites, sous **Licence Ouverte Etalab 2.0**. Le Plan IGN et l'estompage sont servis sans clé par la Géoplateforme (`data.geopf.fr`), et l'application les utilise.
- Le **SCAN 25** (la carte TOP 25 numérisée) demande une clé personnelle, créée sur cartes.gouv.fr. Même l'application officielle gratuite **Cartes IGN** ne le propose pas hors ligne : l'IGN indique que « le SCAN 25 [n'est] pas téléchargeable hors ligne car soumis à des droits de diffusion », mais qu'« il est possible de télécharger des zones du plan IGN pour les consulter hors ligne » ([ign.fr](https://www.ign.fr/telechargez-application-cartographique-cartes-ign)). C'est aussi le choix de cette application.
- Pour avoir le SCAN 25 hors ligne, il reste la **carte papier TOP 25** (voir `docs/MATERIEL.md`) ou une application tierce sous abonnement (non testée ici).

### À télécharger AVANT une coupure (par zone)
1. Centrez la carte sur votre zone (domicile, travail, école, famille, itinéraires d'évacuation).
2. **Cartes** : créez un pack par zone (voir ci-dessus). Le relief détaillé de toute l'Europe est l'une des sources proposées dans le pack.
3. **Points OSM** (zoom ≥ 9) : cochez les catégories (eau, santé, secours/abris, énergie, dangers, ravitaillement), puis téléchargez et nommez la zone. Les points sont stockés sur l'appareil.
   - ⚠ Une fontaine ou une source cartographiée n'est pas forcément potable : traitez l'eau.
4. Recommencez pour chaque zone utile. « Stockage & sources » indique l'espace utilisé ; un pack couvre au maximum 25 000 tuiles. L'application demande au navigateur un stockage persistant.

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

## Accès administrateur
Une **clé administrateur** (licence `KS1.` de formule `admin`, sans expiration) débloque toutes les fonctions : onglet ★ Premium → « J'ai une clé de licence » → coller la clé → Activer. Le badge affiche alors « ★ Admin ».
- Elle est signée avec la clé en service. Tant que l'app est en mode test, c'est la clé de démonstration. Après `node tools/license.mjs keygen`, générez une nouvelle clé administrateur avec `node tools/license.mjs issue --plan admin --email vous@exemple.fr`.
- Sur iOS, cette clé n'est acceptée que si `devAdmin: true` est défini dans `js/config.js` (builds de test internes). Pour tester les achats sans payer, utilisez le bac à sable d'Apple (voir `IOS.md`).
- Ne diffusez pas cette clé : elle vaut accès complet et définitif.

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
