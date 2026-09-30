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
  iap: { annual: 'fr.tenir.premium.annuel', lifetime: 'fr.tenir.premium.avie' },
  termsUrl: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  privacyUrl: '',
  renewUrl: '',
  supportEmail: '',
  licensePublicKeyJwk: {"kty":"EC","x":"5D2m2QBFvxmtR1TBmgCl2AznViS4Nwf0ceTGe3gaVA8","y":"L_Xj9xXf566lcNvwO56oHS40gopxIB9x8yUvPZNC_z0","crv":"P-256"},
  testMode: true,
  graceDays: 7,
  /* iOS : autorise la clé administrateur dans l'app native (tests internes). Laisser à false pour l'App Store. */
  devAdmin: false,
};
