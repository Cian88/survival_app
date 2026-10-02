# Comptes Holdout

> État au 02/10/2026 : le serveur `holdout-api` est en ligne sur `https://api.hold-out.app` (Cloudflare Worker + base D1 `holdout`, Europe de l'Ouest). L'application est prête.
> **À configurer avant publication** : l'envoi des e-mails, Google, Apple, la politique de confidentialité et la vérification des achats App Store (voir « Ce qui reste à configurer »).

## Principe
- **Compte obligatoire, réseau facultatif.** Au premier lancement, l'app demande de créer un compte ou de se connecter. Tout le reste fonctionne ensuite sans réseau.
- **Trois façons de se connecter.** E-mail et mot de passe (avec confirmation de l'adresse), Google ou Apple. Sur iPhone, Apple est proposé dès que Google l'est (règle 4.8 de l'App Store).
- **Hors ligne.**
  - Un compte e-mail peut être **créé sans réseau** : il est enregistré sur le serveur automatiquement au retour du réseau, et l'e-mail de confirmation part à ce moment-là.
  - On peut aussi **se reconnecter sans réseau** à un compte déjà utilisé sur l'appareil, avec le mot de passe, ou la phrase de chiffrement pour Google et Apple.
  - Google et Apple demandent le réseau la première fois.
- **Données chiffrées de bout en bout.**
  - Le profil, l'inventaire, les sacs, le plan, les contacts et les points sont chiffrés sur l'appareil (AES-256-GCM), puis sauvegardés et synchronisés entre appareils.
  - Le serveur ne peut pas les lire.
  - Les cartes et les points OSM téléchargés restent propres à chaque appareil.
- **Premium partout.** Les licences (clé saisie, achat sur le site, achat App Store vérifié par le serveur) sont rattachées au compte, puis retrouvées à la connexion. Elles restent valables hors ligne.

## Sécurité
| Élément | Fonctionnement |
|---|---|
| Mot de passe | Ne quitte jamais l'appareil. PBKDF2-SHA256, 600 000 itérations, sel lié à l'e-mail, sur l'appareil (environ 0,1 s sur PC, un peu plus sur téléphone). Deux clés en dérivent par HKDF : la **clé de connexion**, envoyée au serveur qui n'en garde qu'un HMAC salé, et la **clé d'emballage**, qui reste sur l'appareil |
| Google, Apple | Jeton d'identité vérifié par le serveur (signature RS256, clés publiques du fournisseur, émetteur, application, expiration). Une **phrase de chiffrement**, choisie par l'utilisateur, joue le rôle du mot de passe pour les données |
| Clé des données | Aléatoire, AES-256-GCM. Gardée sur l'appareil sous forme non exportable (IndexedDB). Le serveur n'en a que deux copies « emballées » : l'une par le mot de passe ou la phrase, l'autre par le **code de secours** |
| Code de secours | 130 bits aléatoires, 26 caractères (base32 Crockford), affiché une seule fois à la création. Seul moyen de récupérer les données après un mot de passe oublié. Nouveau code possible depuis « Mon compte » |
| Synchronisation | Sauvegarde versionnée : un conflit est détecté s'il y a eu une écriture ailleurs entre-temps. Fusion à trois voies par rubrique (profil, sacs, inventaire…) : une rubrique modifiée d'un seul côté garde ce côté ; modifiée des deux côtés, l'appareil en cours l'emporte |
| Sessions | Jeton aléatoire stocké haché ; fermées au changement ou à la réinitialisation du mot de passe |
| Abus | 10 essais de connexion par adresse et par quart d'heure, limites par IP pour l'inscription, l'oubli de mot de passe et Google/Apple |
| Prise de compte | Un compte e-mail jamais confirmé, rattaché ensuite par Google ou Apple à la même adresse, perd son mot de passe et ses sessions : celui qui l'avait créé sans prouver l'adresse en perd l'accès |
| Suppression | « Supprimer mon compte » efface le compte, les identités, les sessions, la sauvegarde et les licences (exigence App Store 5.1.1 v) ; l'accès Apple est révoqué si les clés Apple sont configurées |

**Mot de passe oublié.**
1. L'utilisateur reçoit un lien.
2. La page web calcule la nouvelle clé de connexion **dans le navigateur**.
3. Dans l'app, le code de secours est demandé une fois : il ré-emballe la clé des données avec le nouveau mot de passe, pour tous les appareils.

Sans le code, l'utilisateur peut repartir d'une sauvegarde neuve, à partir des données de l'appareil.

## Fichiers
| Fichier | Rôle |
|---|---|
| `js/vault-crypto.js` | Dérivations, emballage des clés, chiffrement, code de secours, fusion (navigateur et Node) |
| `js/account.js` | Écran de connexion, parcours hors ligne, synchronisation, carte « Mon compte », licences |
| `server/` | Worker `holdout-api` : `src/index.js` (routes), `src/lib.js`, `src/pages.js` (pages des e-mails), `migrations/` (schéma D1), `wrangler.json` |
| `tools/account/test-vault-crypto.mjs` | Tests du chiffrement (Node) |
| `server/test/api.test.mjs` | Tests du serveur (`cd server && npm test`) : Worker et D1 locaux, faux Google et Apple |
| `tools/account/e2e.mjs` | Tests de bout en bout dans Edge : 5 appareils simulés, passages hors ligne |

## Ce qui reste à configurer
1. **Envoi des e-mails : Resend** (gratuit jusqu'à 3 000 e-mails/mois ; `MAIL_MODE: "resend"`, expéditeur `compte@hold-out.app`). Domaine `hold-out.app` vérifié chez Resend (enregistrements DNS sur le sous-domaine `send`, sans conflit avec la réception de `contact@`). La clé est le secret GitHub `RESEND_API_KEY`, transmis au Worker par la publication automatique. Tant qu'elle manque, les e-mails sont seulement journalisés (destinataire et sujet) et les comptes fonctionnent sans confirmation.
2. **Google.**
   - Dans Google Cloud Console, créer un écran de consentement OAuth et deux identifiants client : « Application Web » (origines : l'adresse de la webapp) et « iOS » (bundle `com.holdout.app`).
   - Les renseigner dans `js/config.js` (`account.google.webClientId` et `iosClientId`) et dans `server/wrangler.json` (`GOOGLE_CLIENT_IDS`, séparés par une virgule).
   - Pour iOS, ajouter le « reversed client ID » comme schéma d'URL dans `Info.plist`.
3. **Apple.**
   - Dans Apple Developer, activer « Sign in with Apple » pour `com.holdout.app` (capacité Xcode). Il fonctionne alors sur iPhone, et `APPLE_AUDIENCES` contient déjà `com.holdout.app`.
   - Pour la webapp : créer un Services ID et vérifier le domaine. Renseigner le Services ID dans `js/config.js` (`account.apple.servicesId`, `redirectUri`) et l'ajouter à `APPLE_AUDIENCES`.
   - Pour révoquer l'accès à la suppression du compte (demandé par Apple), créer une clé « Sign in with Apple », puis `wrangler secret put` : `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` (contenu du `.p8`).
4. **Politique de confidentialité.** Elle est obligatoire pour l'App Store dès qu'il y a des comptes. Il faut la publier (par exemple `https://hold-out.app/confidentialite`) et la renseigner dans `account.privacyUrl` et `privacyUrl` (`js/config.js`). À y décrire : l'adresse e-mail, les jetons de session, la sauvegarde chiffrée illisible par Holdout, les licences, l'hébergement Cloudflare (UE) et la suppression du compte.
5. **Achats App Store → Premium sur le site.**
   - Créer une clé API « In-App Purchase » dans App Store Connect, puis `wrangler secret put` : `APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID`, `APPSTORE_PRIVATE_KEY`.
   - Ajouter `LICENCE_PRIVATE_JWK`, la clé privée des licences : le fichier `license-keys/private.jwk` n'est pas sur cette machine.
   - Sans ces secrets, la route répond « non configurée ». L'achat reste actif sur iPhone, mais n'est pas retrouvé sur le site.

Déployer après un changement : `cd server && npx wrangler deploy` ; schéma : `npm run db:migrate`.

## Points à surveiller
- **iPhone non testé ici** (pas de Mac) : à vérifier sur un appareil.
  - Après `npm run ios:sync` : connexion Google et Apple par le plugin `@capgo/capacitor-social-login` 8.5.12.
  - Temps de calcul de la clé (600 000 itérations).
  - Sauvegarde de secours du compte dans les préférences natives.
- Le bouton Google de la webapp est celui de Google (Google Identity Services), chargé seulement en ligne.
- La fusion par rubrique ne fusionne pas l'intérieur d'une rubrique : deux appareils qui modifient l'inventaire en même temps, sans synchroniser entre-temps, gardent la version de celui qui synchronise en dernier (pas de doublon, pas de perte de structure).
