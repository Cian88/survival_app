# Application iOS : compiler, tester, publier

L'application iOS est le **même code** que la version web, intégré dans une application native avec [Capacitor](https://capacitorjs.com) 8. Toutes les données (cartes intégrées, contenus, catalogue) sont **embarquées dans l'app** : elle fonctionne hors ligne dès l'installation. Les cartes IGN téléchargées par zone restent sur l'iPhone.

## Ce qui est natif sur iOS

| Fonction | Module | Rôle |
|---|---|---|
| Position GPS | `@capacitor/geolocation` | Instant T, carte, domicile. Fonctionne sans Internet. Autorisation demandée au premier usage |
| Achats intégrés | `@capgo/native-purchases` (StoreKit 2) | Abonnements mensuel et annuel, achat à vie, restauration, gestion de l'abonnement |
| Export de fichiers | `@capacitor/filesystem` + `@capacitor/share` | CSV, sauvegarde JSON, GPX, packs de cartes `.kspack` → feuille de partage iOS (Fichiers, AirDrop, e-mail…) |
| Sauvegarde de sécurité | `@capacitor/preferences` | Copie de l'état dans le stockage natif, restaurée si le stockage web est vidé |
| Interface | CSS | Barre d'onglets en bas, zones sûres (encoche, barre d'accueil), icône et écran de démarrage |

Appels téléphoniques : les boutons 112 / 15 / 18 / 17 / SMS 114 ouvrent le téléphone de l'iPhone.

## Paiements : obligations de l'App Store

La règle 3.1.1 de l'App Store impose d'utiliser les **achats intégrés** d'Apple pour débloquer des fonctions. Elle **interdit les clés de licence**, et un mécanisme de **restauration des achats** est obligatoire ([App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)). En conséquence :
- **Sur iOS**, l'onglet Premium utilise **uniquement StoreKit** : pas de clé de licence, pas de lien vers un paiement externe.
- **Sur le web**, le système de licences signées (voir `MONETISATION.md`) reste utilisable.
- Les liens vers un paiement externe ne sont autorisés que sur la vitrine **États-Unis**, ou avec des autorisations spécifiques selon les pays (même page Apple). Ils ne sont pas utilisés ici.

Les deux systèmes ne se croisent pas : un achat web ne débloque pas l'app iOS et inversement.

## Ce qu'il vous faut
- **Un Mac** avec **Xcode** à jour. La compilation iOS est impossible sous Linux ou Windows.
- **Un compte Apple Developer** : 99 $ US par an, montant affiché en devise locale à l'inscription. En tant que société, il faut un **numéro D-U-N-S** et un site web ([Apple](https://developer.apple.com/programs/enroll/)).
- Node.js 20 ou plus récent.

## Compiler et lancer
```sh
npm install                 # installe Capacitor et les modules natifs
npm run ios:sync            # assemble www/ et le copie dans le projet iOS
npm run ios:open            # ouvre ios/App dans Xcode
```
Dans Xcode :
1. Onglet *Signing & Capabilities* : choisissez votre **Team** et vérifiez le **Bundle Identifier** (`fr.kitsurvie.europe` par défaut, à remplacer par le vôtre ici et dans `capacitor.config.json`). Ajoutez la capacité **In-App Purchase**.
2. Choisissez un simulateur ou votre iPhone, puis lancez l'app (▶).
3. **Tester les achats sans payer** : créez un fichier *StoreKit Configuration* (File › New › StoreKit Configuration File), ajoutez-y les 3 produits ci-dessous, puis sélectionnez-le dans *Product › Scheme › Edit Scheme › Run › Options*. Vous pouvez aussi utiliser un compte *Sandbox* dans App Store Connect.

Après chaque modification du code web : `npm run ios:sync`.

## App Store Connect : les produits
Créez l'app, puis les achats intégrés. Leurs identifiants doivent correspondre à `js/config.js` → `iap` :

| Produit | Type | Identifiant | Prix visé |
|---|---|---|---|
| Premium mensuel | Abonnement auto-renouvelable, groupe « Premium » | `fr.kitsurvie.premium.mensuel` | 3,90 € |
| Premium annuel | Abonnement auto-renouvelable, même groupe | `fr.kitsurvie.premium.annuel` | 29,90 € |
| Premium à vie | Non consommable | `fr.kitsurvie.premium.avie` | 59,90 € |

- **Prix** : Apple propose 900 paliers de prix, y compris des terminaisons en ,90 ou ,95 (d'après la [documentation Apple sur les prix](https://developer.apple.com/help/app-store-connect/manage-app-pricing/set-a-price/)). Vérifiez dans App Store Connect que 3,90 €, 29,90 € et 59,90 € sont disponibles pour la France ; sinon, prenez le palier le plus proche. L'app affiche toujours le **prix renvoyé par l'App Store**, dans la devise de l'utilisateur.
- **Commission** : Apple prélève une commission sur chaque vente, et le taux dépend de votre situation (programme pour petits développeurs, ancienneté de l'abonnement). Vérifiez les conditions en vigueur sur developer.apple.com, car je ne les ai pas vérifiées ici.

## Fiche App Store et validation
- **Confidentialité** : aucune donnée n'est collectée. Tout reste sur l'appareil, sans compte ni statistiques. Vous pouvez déclarer « Aucune donnée collectée » après vérification de votre part. Une **URL de politique de confidentialité** reste obligatoire : renseignez-la aussi dans `js/config.js` → `privacyUrl`.
- **Abonnements** : l'onglet Premium affiche le prix, la durée, le renouvellement automatique, la gestion et la résiliation, et un lien vers les **conditions d'utilisation**. Le lien par défaut pointe vers le contrat de licence standard d'Apple (`termsUrl`).
- **Chiffrement** : `ITSAppUsesNonExemptEncryption = false` est déclaré dans `Info.plist`, car l'app n'utilise que le HTTPS standard. À confirmer selon votre situation.
- **Règle 4.2 (fonctionnalités minimales)** : Apple refuse les sites simplement emballés. Mettez en avant dans les notes de validation les fonctions propres à l'app : cartes topographiques **hors ligne**, **GPS sans réseau**, état des lieux personnalisé calculé sur l'appareil, achats intégrés, export via la feuille de partage.
- **Captures d'écran** : Instant T, État des lieux, Carte hors ligne, Profil, Premium.
- **Version de test** : distribuez-la par TestFlight avant la soumission.

## Limites connues
- **Non compilée ici** : l'app a été générée et testée dans un navigateur qui **simulait** les modules iOS (GPS, achats, fichiers, préférences), mais pas sur un vrai iPhone. Un test sur appareil reste nécessaire.
- **Stockage des tuiles** : les tuiles de carte sont stockées dans l'IndexedDB du moteur web de l'app. Exportez vos packs (`.kspack`) pour en garder une copie.
- **Achats hors ligne** : la vérification utilise StoreKit ; hors ligne, l'app reprend le **dernier état connu**, avec 7 jours de grâce pour les abonnements.
