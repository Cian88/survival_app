# Notice d'utilisation — Holdout

> Outil d'aide à la préparation. Il ne remplace ni les consignes des autorités (préfecture, secours), ni une formation aux premiers secours.
> Vos données vivent sur votre appareil. Votre compte en garde une copie **chiffrée sur l'appareil avant envoi** : personne d'autre que vous, pas même Holdout, ne peut la lire.

## 1. Installation et usage hors ligne

| Méthode | Comment | Hors ligne ? |
|---|---|---|
| **Serveur local (recommandé)** | Linux/macOS : `./lancer.sh` — Windows : double-clic sur `lancer.bat` (Python 3 requis), puis ouvrir `http://localhost:8765` | Oui, après le premier chargement : le *service worker* met toute l'application en cache ; vous pouvez l'installer (menu du navigateur → « Installer l'application »). |
| **Hébergement web** (ex. GitHub Pages) | Publier le dépôt, ouvrir l'URL sur téléphone, « Ajouter à l'écran d'accueil » | Oui, après le premier chargement. |
| **Double-clic sur `index.html`** | Ouvre le fichier directement | Oui pour l'application et le relief intégré ; pas d'installation possible, et le stockage dépend du navigateur. |

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
   - **Sélecteur d'autonomie** (24 h, 48 h, 72 h, 5, 7, 10 ou 14 jours) : seuls les **consommables** se recalculent : eau portée (1 L/jour, 3 L au plus), pastilles, rations (kcal du profil), repas lyophilisés, cartouches de gaz, allume-feu, piles, lingettes, médicaments. Les **équipements durables** (filtre, réchaud, panneau solaire, vêtements lavables, outils) ne dépendent pas de la durée : un filtre sert 1 jour comme 3 mois. Chaque règle affiche sa base ; « hypothèse » signale un choix sans source chiffrée. Si vous modifiez une quantité à la main, elle n'est plus recalculée.
   - **Budget** : à la création d'un sac, choisissez petit budget, budget moyen ou gros budget (le coût estimé du sac pré-rempli s'affiche pour chacun). Chaque objet reçoit alors le modèle de cette gamme, son prix indicatif et un lien « Amazon ». Le sélecteur « Budget » du sac change de gamme à tout moment ; une ligne dont vous avez modifié le prix ou le poids reste telle quelle.
   - Variantes selon le lieu et le climat.
6. **Stock maison** : durée d'autonomie visée (3 à 90 jours), inventaire daté (litres, kcal, péremption) et 9 piliers. La durée recalcule les consommables des achats « maison » : pastilles, papier toilette, sacs, cartouches de gaz. L'eau **stockée** (et donc le nombre de jerricans) est plafonnée à **14 jours** : au-delà, l'état des lieux demande une **source d'eau renouvelable** (pluie, puits, cours d'eau) et un traitement. Les équipements (filtre, récupérateur, panneaux solaires, station électrique, réchaud) ne se multiplient pas avec la durée.
7. **Terrain** : ce que disent les praticiens, les forums et les témoins de crises réelles.
8. **Calculateurs** : eau, dose de Javel selon votre flacon, batterie, solaire, eau de pluie, poids du sac, temps de marche, stock profond, gaz par temps froid.
9. **Matériel & budget** : chaque objet du catalogue en 3 gammes (petit, moyen, gros budget) avec modèle, prix indicatif, poids connu et lien Amazon.fr ; récapitulatif budgétaire dans la gamme choisie (aussi réglable dans Mon profil, pour la maison). Prix indicatifs du marché : le prix réel s'affiche sur Amazon. Détail : [`MATERIEL.md`](MATERIEL.md) et [`AMAZON.md`](AMAZON.md).
   **Plan & scénarios**, **Notice**.
10. **★ Premium** : offres (29,90 €/an ou 59,90 € à vie) et activation d'une clé de licence, vérifiée sur l'appareil sans Internet. Tout ce qui sert en urgence reste gratuit. Le détail est dans [`MONETISATION.md`](MONETISATION.md).

## 3. La carte hors ligne

**Orientation** : la carte n'est jamais tournée, le **haut est toujours le nord géographique**. Une flèche « N » reste affichée en permanence en haut à gauche, sous les boutons de zoom. Le nord magnétique indiqué par une boussole s'en écarte de quelques degrés (déclinaison magnétique, variable selon le lieu et l'année) : pour un azimut précis, corrigez-la.

### Cartes topographiques hors ligne : l'essentiel
La carte est une **carte topographique dessinée sur l'appareil** : routes, chemins et sentiers, forêts, cours d'eau, lieux-dits, sommets avec leur altitude, ombrage du relief et courbes de niveau (tous les 10 m au plus près), partout en Europe. Elle reste nette à tous les zooms. En ligne, toute l'Europe s'affiche. Hors ligne, s'affichent vos **packs** et les zones déjà consultées ; ailleurs, l'image du relief Europe, intégrée à l'application, sert de repère.

1. Renseignez votre domicile dans **Mon profil**.
2. Ouvrez **Carte hors ligne → 📥 Cartes hors ligne**, puis choisissez :
   - **Zone** : autour du domicile, autour de votre position GPS, ou la zone affichée.
   - **Rayon** : de 5 à 1 000 km. Pour la zone affichée, c'est la demi-largeur de l'écran qui compte : zoomez sur la zone à garder.
   - Le pack contient toujours **tout le détail**, jusqu'aux sentiers et aux courbes de 10 m. Ordre de grandeur : 5 Mo pour 12 km de rayon, environ 45 Mo pour une zone de 65 × 60 km.
3. Vérifiez l'estimation de taille, puis téléchargez. Le pack reste sur l'appareil. Ajoutez d'autres packs pour le travail, la famille et vos itinéraires.
4. Hors ligne, il n'y a rien à choisir : la carte affiche les packs.
5. **Exporter** un pack crée un fichier `.kspack` à copier sur une clé USB ou un autre appareil ; on le réimporte avec « Importer un pack ».

Les données viennent d'OpenStreetMap (fond) et de Mapterhorn (altitudes : IGN pour la France, CNIG pour l'Espagne, Copernicus ailleurs). Fonctionnement et hébergement : [`TUILES.md`](TUILES.md).

**Packs des versions précédentes** (IGN, relief, OpenTopoMap) : ils ne s'affichent plus. Ils restent dans la liste, marqués « ancienne carte », pour libérer leur espace en un clic.

### À télécharger AVANT une coupure (par zone)
1. Centrez la carte sur votre zone (domicile, travail, école, famille, itinéraires d'évacuation).
2. **Cartes** : créez un pack par zone (voir ci-dessus).
3. **Points OSM** (zoom ≥ 9) : cochez les catégories (eau, santé, secours/abris, énergie, dangers, ravitaillement), puis téléchargez et nommez la zone. Les points sont stockés sur l'appareil.
   - ⚠ Une fontaine ou une source cartographiée n'est pas forcément potable : traitez l'eau.
4. Recommencez pour chaque zone utile. « Stockage & sources » indique l'espace utilisé. Si le stockage ne permet plus d'enregistrer les tuiles, le téléchargement s'arrête avec un message ; les tuiles non enregistrées ne sont pas comptées comme disponibles hors ligne. L'application demande au navigateur un stockage persistant.
5. « Vider le cache de navigation » efface les tuiles gardées en consultant la carte, sans toucher aux packs.

### Mes points
Ajoutez vos points de rendez-vous, caches, refuges, points d'eau vérifiés et dangers. Vous pouvez les exporter en **GPX** (pour un GPS ou une application de randonnée) ou en **GeoJSON**, et les importer depuis ces deux formats.

### Outils
- **Ma position** : GPS du téléphone, fonctionne sans Internet.
- **Mesurer** : distance cumulée et temps de marche indicatif à 4 km/h sur terrain plat, sans compter le dénivelé.
- **Clic sur la carte** : coordonnées décimales et en degrés-minutes-secondes, et altitude. L'altitude (≈ 15 m de précision horizontale) vient du pack de la zone, ou de la connexion.

**Et le papier** : gardez des **cartes papier** (IGN TOP 25 / TOP 100 ou équivalent) et une **boussole**. La Suède (MSB) les recommande explicitement pour l'évacuation.

## Accès administrateur
Une **clé administrateur** (licence `KS1.` de formule `admin`, sans expiration) débloque toutes les fonctions : onglet ★ Premium → « J'ai une clé de licence » → coller la clé → Activer. Le badge affiche alors « ★ Admin ».
- Elle est signée avec la clé en service. Tant que l'app est en mode test, c'est la clé de démonstration. Après `node tools/license.mjs keygen`, générez une nouvelle clé administrateur avec `node tools/license.mjs issue --plan admin --email vous@exemple.fr`.
- Sur iOS, cette clé n'est acceptée que si `devAdmin: true` est défini dans `js/config.js` (builds de test internes). Pour tester les achats sans payer, utilisez le bac à sable d'Apple (voir `IOS.md`).
- Ne diffusez pas cette clé : elle vaut accès complet et définitif.

## 4. Compte et sauvegarde

### Le compte
- **Au premier lancement**, créez un compte (e-mail et mot de passe, Google ou Apple), ou connectez-vous. **Sans réseau**, la création par e-mail fonctionne : le compte est enregistré en ligne dès que le réseau revient.
- **Le code de secours**, affiché une seule fois à la création, est le seul moyen de retrouver vos données si vous oubliez votre mot de passe. Notez-le ou imprimez-le, et rangez-le avec vos papiers importants, hors du téléphone.
- **Google ou Apple** : choisissez une **phrase de chiffrement**. Elle protège vos données et permet de vous reconnecter sans réseau.
- **Synchronisation** : profil, inventaire, sacs, plan, contacts et points sont sauvegardés et synchronisés entre vos appareils dès que le réseau le permet. Les cartes et points OSM téléchargés restent propres à chaque appareil.
- **Hors ligne** : l'application reste ouverte. Après une déconnexion, vous vous reconnectez sans réseau avec votre mot de passe (ou votre phrase) sur un appareil déjà utilisé.
- **Mot de passe oublié** (réseau nécessaire) : un lien par e-mail permet d'en choisir un nouveau ; votre code de secours vous est ensuite demandé une fois dans l'application.
- **Profil → Mon compte** : état de la sauvegarde, changement de mot de passe ou de phrase, nouveau code de secours, déconnexion, suppression du compte.

### Copies de sécurité

- **Paramètres → Sauvegardes → Exporter mes données** : sauvegarde complète en JSON (profil, inventaire, sacs, plan, contacts, points). Gardez-en une copie sur une clé USB. Sur mobile, ouvrez les paramètres depuis « Plus ».
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
