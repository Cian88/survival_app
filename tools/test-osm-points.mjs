/* Tests du catalogue des points utiles OpenStreetMap (js/osm-points.js), sans réseau. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const O = createRequire(import.meta.url)('../js/osm-points.js');

for (const [cat, sel, label] of O.TYPES) {
  assert.ok(O.CATS[cat], `catégorie inconnue pour ${sel}`);
  assert.ok(label && !/[a-z]+_[a-z]+/.test(label), `libellé français attendu pour ${sel}`);
  assert.doesNotThrow(() => O.parse(sel), sel);
}
assert.equal(O.overpass(O.parse('nwr[amenity=fountain][drinking_water=yes]')), 'nwr["amenity"="fountain"]["drinking_water"="yes"]');
assert.equal(O.overpass(O.parse('nwr[hazard]')), 'nwr["hazard"]');
assert.equal(O.overpass(O.parse('nwr[power=substation][substation!~^(minor_distribution|distribution)$]')), 'nwr["power"="substation"]["substation"!~"^(minor_distribution|distribution)$"]');
const q = O.query(['eau', 'argent'], [45.7, 4.8, 45.8, 4.9]);
assert.match(q, /^\[out:json\]\[timeout:120\];\(.+\);out center tags qt;$/);
assert.ok(q.includes('node["natural"="spring"](45.7,4.8,45.8,4.9);') && q.includes('nwr["amenity"="atm"](45.7,4.8,45.8,4.9);'));
assert.ok(!q.includes('pharmacy'), 'Seules les catégories demandées');
console.log(`PASS: ${O.TYPES.length} types dans ${Object.keys(O.CATS).length} catégories, requête Overpass correcte`);

const el = (type, tags) => ({ type, id: 1, tags });
const label = (e, cats) => { const t = O.classify(e, cats); return t && `${t.cat}:${t.label}`; };
assert.equal(label(el('node', { amenity: 'hospital', emergency: 'yes' })), 'sante:Hôpital avec urgences');
assert.equal(label(el('way', { amenity: 'hospital' })), 'sante:Hôpital');
assert.equal(label(el('way', { natural: 'spring' })), null, 'Une source est un nœud');
assert.equal(label(el('node', { power: 'substation' })), 'energie:Poste électrique haute tension', '!~ accepte une étiquette absente, comme Overpass');
assert.equal(label(el('node', { power: 'substation', substation: 'distribution' })), null);
assert.equal(label(el('way', { natural: 'water', water: 'river' })), null, 'Les rivières ne sont pas des plans d\'eau');
assert.equal(label(el('way', { natural: 'water', water: 'pond' })), 'eaubrute:Plan d\'eau');
assert.equal(label(el('relation', { natural: 'water' })), 'eaubrute:Plan d\'eau');
assert.equal(label(el('node', { amenity: 'shelter', shelter_type: 'public_transport' })), null, 'Abribus exclu');
assert.equal(label(el('node', { amenity: 'shelter', shelter_type: 'basic_hut' })), 'abri:Abri');
assert.equal(label(el('node', { amenity: 'vending_machine', vending: 'drinks;sweets' })), 'ravito:Distributeur (eau, boissons, nourriture)');
assert.equal(label(el('node', { amenity: 'vending_machine', vending: 'parking_tickets' })), null);
assert.equal(label(el('node', { man_made: 'storage_tank', content: 'water' })), null, 'Réservoir d\'eau : pas un danger');
const camp = el('node', { tourism: 'camp_site', drinking_water: 'yes' }), postOffice = el('node', { amenity: 'post_office' });
assert.equal(label(camp, ['eau', 'abri']), 'abri:Camping', 'Le type le plus précis l\'emporte');
assert.equal(label(camp, ['eau']), 'eau:Eau potable disponible', 'Classé parmi les catégories demandées seulement');
assert.equal(label(postOffice, ['argent']), null);
assert.equal(label(postOffice, ['comm', 'argent']), 'comm:Bureau de poste');
console.log('PASS: classement (types précis d\'abord, catégories demandées, filtres absents/regex comme Overpass)');

assert.equal(O.typeLabel(el('node', { amenity: 'drinking_water' })), 'Point d\'eau potable', 'Points des anciennes zones : libellé lisible');
assert.deepEqual(O.details(el('node', { opening_hours: 'Mo-Fr 08:00-19:00', phone: '+33 1 23', 'contact:phone': '+33 9', drinking_water: 'yes', fee: 'no', emergency: 'yes', ele: '1520' })),
  [['Horaires', 'Mo-Fr 08:00-19:00'], ['Téléphone', '+33 1 23'], ['Urgences', 'oui'], ['Eau potable', 'oui'], ['Payant', 'non'], ['Altitude', '1520 m']]);
assert.deepEqual(O.defaults(), ['eau', 'sante', 'secours', 'abri', 'comm', 'transport', 'energie', 'dangers']);
console.log('PASS: libellés des anciens points, détails en français, catégories cochées par défaut');
