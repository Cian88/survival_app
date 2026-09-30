/* Synthèse de la chaîne YouTube « Apprendre Préparer (Sur)vivre » (APS), observée le 30/09/2026.
   Analyse complète et sourcée : docs/APS.md. Ce sont les recommandations d'un créateur de contenu,
   pas d'une autorité : l'application les présente à côté des repères officiels. */
(function () {
  const yt = (id, t) => `<a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">${t}</a>`;
  const BAG = [
    ['Sac', '30 L minimum, confortable, discret, rien d\'accroché à l\'extérieur ; sac étanche intérieur, sangle'],
    ['Eau & nourriture', '1 bouteille de 1,5 L, 1 gourde filtrante, 2 jours de nourriture sans cuisson'],
    ['Couchage & vêtements', 'sac de couchage, couverture de survie, poncho, polaire, pantalon, sous-vêtements'],
    ['Outils & lumière', 'couteau, pince multifonction, lampe à manivelle, lampe frontale, briquet'],
    ['Soins & hygiène', 'kit de premiers secours, mouchoirs, kit d\'hygiène'],
    ['Signalisation & orientation', 'sifflet, carte de la région, (petite bombe lacrymogène*)'],
    ['Documents & argent', 'photocopies d\'identité, double des clés, annuaire des contacts, argent liquide'],
    ['Options', 'traitements + fiche santé, lunettes, corde, bâche, boussole, trauma kit, bougies'],
    ['Enfants', '1,5 L d\'eau, 2 jours de nourriture, sifflet, lampe, couverture de survie, contacts'],
  ];
  window.APS_BAG = BAG;
  window.APS = {
    html: `
    <p class="small muted">Chaîne YouTube <a href="https://www.youtube.com/@apprendrepreparersurvivre6007" target="_blank" rel="noopener">@apprendrepreparersurvivre6007</a> (≈ 93 600 abonnés, 82 vidéos, 5 lives au 30/09/2026) et site <a href="https://www.apprendre-preparer-survivre.com" target="_blank" rel="noopener">apprendre-preparer-survivre.com</a>. Analyse faite à partir des titres, descriptions, sous-titres automatiques de 49 vidéos et de 3 PDF publics. Il s'agit de l'avis d'un créateur de contenu, pas d'une source officielle. Détails et liens : <code>docs/APS.md</code>.</p>
    <h3>La méthode</h3>
    <ul>
      <li><b>Ordre des ressources</b> : eau → nourriture → énergie → argent (<i>Guide de préparation à la (sur)vie</i>, PDF APS).</li>
      <li><b>Connaissances, puis condition physique, puis matériel</b> : « le matériel sans la formation ne sert strictement à rien » (${yt('eoVUCb00Grg', 'Kit de secours')}).</li>
      <li><b>Couches</b> : EDC (sur soi, pour rentrer à pied) → sac d'évacuation (24 h minimum, 48–72 h visées) → stock domestique (« dynamique » en rotation + « mort » longue conservation) → <b>BAD</b>, Base Autonome Durable (${yt('W8QGqfgEgpA', 'Stock en 10 étapes')}, ${yt('YUc7A0M8iIc', 'BAD partie 2')}).</li>
      <li><b>Ville</b> : on y parle de résilience plutôt que d'autonomie ; partir tôt : « s'il y a un doute, c'est qu'il n'y a pas de doute » (${yt('s7BQ__YGRwM', 'Quitter la ville')}).</li>
      <li><b>Homme gris</b> (discrétion), <b>redondance</b> (« deux c'est un, un c'est rien »), <b>entraide</b> avec les voisins, <b>défense passive</b> uniquement.</li>
      <li><b>Faire son sac soi-même et le tester</b> (une après-midi, puis une nuit) plutôt qu'acheter un kit tout fait ; stocker ce qu'on aime manger (${yt('SlCeW_V7RrY', 'Sac d\'évacuation 2021')}, ${yt('ujnonTAgqFc', 'Conférence sac 2025')}).</li>
    </ul>
    <h3>Son sac d'évacuation (liste du PDF public APS)</h3>
    <table>${BAG.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${v}</td></tr>`).join('')}</table>
    <p class="small muted">* La bombe lacrymogène est une arme de catégorie D en France : son port sans motif légitime est interdit, et l'achat est réservé aux majeurs. Renseignez-vous sur la loi de votre pays. Source de la liste : <a href="https://static.apprendre-preparer-survivre.com/leadgen/Apprendre-Preparer-Survivre-GPS-Sac-evacuation-urgence.pdf" target="_blank" rel="noopener">PDF « Le sac d'évacuation d'urgence »</a>.</p>
    <h3>Repères chiffrés de la chaîne et repères officiels</h3>
    <div class="tablewrap"><table><tr><th>Sujet</th><th>APS</th><th>Repère officiel</th></tr>
      <tr><td>Eau stockée</td><td>Vidéos : 1,5 à 3 L/pers/j ; guide : 4 L/pers/j, 1 semaine à la campagne et 2 en ville (≈ 120 L/adulte/mois)</td><td>2 L/pers/j (BBK), 3 L (MSB) ; 6 L/pers pour 72 h (SGDSN)</td></tr>
      <tr><td>Durée du stock alimentaire</td><td>1 mois minimum, 3 mois comme base solide</td><td>72 h (UE, FR), 1 semaine (SE, CH), 10 jours (DE)</td></tr>
      <tr><td>Renouvellement de l'eau</td><td>Tous les 6 mois</td><td>1 à 2 fois par an (MSB)</td></tr>
      <tr><td>Vérification du sac</td><td>1 fois par an</td><td>2 fois par an (SGDSN)</td></tr>
      <tr><td>Filtration</td><td>« Filtrer compte plus que stocker » : gourde filtrante, filtre à gravité</td><td>Filtrer PUIS désinfecter ; les filtres de randonnée n'arrêtent pas les virus (CDC)</td></tr>
      <tr><td>Iode</td><td>2 comprimés de 65 mg pour un adulte</td><td>Même posologie, uniquement sur ordre du préfet (ASNR)</td></tr>
    </table></div>
    <h3>Autres conseils pratiques</h3>
    <ul>
      <li><b>Navigation</b> : carte papier et boussole ; cercles de 10, 20 et 30 km autour du domicile (≈ une journée de marche chacun) ; 3 itinéraires de repli avec points d'eau, de nourriture et de bivouac repérés. L'onglet Carte permet de tracer ces cercles autour de vos points.</li>
      <li><b>Communication</b> : radio à manivelle pour savoir si la panne est locale ; talkies PMR446 sur un canal convenu à l'avance (quelques centaines de mètres en ville) ; émettre avec un Baofeng demande une licence de radioamateur.</li>
      <li><b>Énergie</b> : petits appareils et powerbank d'abord ; panneau solaire nomade de 20 W minimum ; groupe électrogène jamais à l'intérieur (CO) ; renouveler le stock d'essence tous les 3 à 6 mois (${yt('Uy_Ie_6Pc54', 'Black-out en 8 étapes')}).</li>
      <li><b>Premiers secours</b> : trois kits (quotidien, voiture, maison/atelier) ; garrot avec l'heure de pose notée ; formation PSC1 d'abord.</li>
      <li><b>Hygiène</b> : toilettes d'urgence à moins de 10 € (seau, sacs, gants, gel hydroalcoolique) (${yt('tHOwW7qbKvk', 'Toilettes d\'urgence')}).</li>
      <li><b>Argent</b> : liquide en petites coupures et épargne de précaution par paliers (1–3, puis 3–6, puis 6–12 mois de dépenses).</li>
    </ul>
    <h3>Vidéos clés</h3>
    <p class="small">${[['SlCeW_V7RrY', 'Sac d\'évacuation (2021)'], ['ujnonTAgqFc', 'Conférence sac (2025)'], ['9C65t2pg_jw', 'Sac enfants'], ['3xwR8YwXEBY', 'EDC'], ['eoVUCb00Grg', 'Kit de secours'], ['qZ98a4u8ZRE', 'Autonomie en eau'], ['W8QGqfgEgpA', 'Stock en 10 étapes'], ['50Sc1l4ZHYg', 'Conférence nourriture'], ['Uy_Ie_6Pc54', 'Black-out en 8 étapes'], ['nmKRb7zrmQc', 'Top 17 objets'], ['s7BQ__YGRwM', 'Quitter la ville'], ['YUc7A0M8iIc', 'BAD partie 2'], ['qBD9q1pTQyg', 'Analyse « Tous responsables »'], ['dTuRHhk55bY', 'Iode'], ['tHOwW7qbKvk', 'Toilettes d\'urgence']].map(([i, t]) => yt(i, t)).join(' · ')}</p>`,
  };
})();
