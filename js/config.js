/* Configuration de la version Premium.
   - checkout : liens de paiement du prestataire choisi (Stripe, Lemon Squeezy, Paddle…), un par formule.
   - licensePublicKeyJwk : clé PUBLIQUE qui vérifie les licences hors ligne (générée par `node tools/license.mjs keygen`).
   - testMode : true tant que la clé de démonstration (tools/test-keys) est utilisée — à passer à false en production. */
window.KS_CONFIG = {
  prices: {
    annual: { amount: 29.90, label: '29,90 €', per: 'par an', note: 'Résiliable à tout moment, sans engagement au-delà de l\'année en cours' },
    lifetime: { amount: 59.90, label: '59,90 €', per: 'une seule fois', note: 'Accès à vie, mises à jour comprises' },
  },
  checkout: { annual: '', lifetime: '' },
  /* iOS (App Store) : identifiants des produits d'achat intégré créés dans App Store Connect.
     annual = abonnement auto-renouvelable ; lifetime = achat non consommable. */
  iap: { annual: 'com.holdout.premium.annual', lifetime: 'com.holdout.premium.lifetime' },
  termsUrl: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  privacyUrl: 'https://hold-out.app/confidentialite/',
  renewUrl: '',
  supportEmail: 'contact@hold-out.app',
  licensePublicKeyJwk: {"kty":"EC","x":"IdqYx6angxphy55nHURxu1X2VucUMhNFpTBs2lQLpKY","y":"Vxo3q2XOSAB-CwGICc_ehfsQW31Qb-UvZYx0_kWK0Uk","crv":"P-256"},
  testMode: false,
  graceDays: 7,
  /* iOS : autorise la clé administrateur dans l'app native (tests internes). Laisser à false pour l'App Store. */
  devAdmin: false,
  /* Carte topographique (js/topo.js) : fichiers PMTiles hébergés sur Cloudflare R2 (bucket holdout-cartes,
     domaine cartes.hold-out.app), lus par lectures partielles HTTP. Extraits Europe du 02/10/2026 (docs/TUILES.md) :
     - osm : fond OpenStreetMap au schéma Protomaps (48,6 Go) ;
     - terrain : altitudes Mapterhorn, détail 0 à 12 (26 Go). */
  map: {
    osm: 'https://cartes.hold-out.app/osm-europe-20261002.pmtiles',
    terrain: 'https://cartes.hold-out.app/terrain-europe-z12.pmtiles',
  },
  /* Compte (js/account.js, serveur dans server/). Google et Apple n'apparaissent que si leurs identifiants sont renseignés
     (docs/COMPTES.md) ; sur iPhone, Apple est toujours proposé. privacyUrl : politique de confidentialité (exigée par l'App Store). */
  account: {
    api: 'https://api.hold-out.app',
    google: { webClientId: '17816717554-2p6ma9dqj9g7er9colmp24hrr8ed02kb.apps.googleusercontent.com', iosClientId: '' },
    apple: { servicesId: '', redirectUri: 'https://hold-out.app/' },
    privacyUrl: 'https://hold-out.app/confidentialite/',
    termsUrl: 'https://hold-out.app/conditions/',
  },
};
