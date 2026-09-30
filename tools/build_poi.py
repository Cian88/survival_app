import json, csv, re
def pt(c):
    m = re.match(r'Point\(([-\d.eE]+) ([-\d.eE]+)\)', c); return round(float(m.group(2)),4), round(float(m.group(1)),4)
def val(b,k): return b[k]['value'] if k in b else None
nuc = {}
for b in json.load(open('wd_nuc.json'))['results']['bindings']:
    q = val(b,'item').rsplit('/',1)[1]
    lat, lon = pt(val(b,'coord'))
    e = nuc.setdefault(q, {"id":q,"name":val(b,'itemLabel'),"country":val(b,'countryLabel'),"lat":lat,"lon":lon,"state":set(),"cap":None,"start":None,"end":None})
    if val(b,'stateLabel'): e['state'].add(val(b,'stateLabel'))
    for k in ('cap',):
        if val(b,k): e[k] = max(e[k] or 0, round(float(val(b,k))))
    if val(b,'start'): e['start'] = val(b,'start')[:4]
    if val(b,'end'): e['end'] = val(b,'end')[:4]
nl = []
for e in nuc.values():
    e['state'] = ', '.join(sorted(e['state'])) or None
    nl.append(e)
dams = {}
for b in json.load(open('wd_dam.json'))['results']['bindings']:
    q = val(b,'item').rsplit('/',1)[1]; lat, lon = pt(val(b,'coord'))
    dams[q] = {"id":q,"name":val(b,'itemLabel'),"country":val(b,'countryLabel'),"lat":lat,"lon":lon,"height_m":round(float(val(b,'height'))),"cap":val(b,'cap')}
EU = set("ALB AND AUT BEL BGR BIH BLR CHE CYP CZE DEU DNK ESP EST FIN FRA GBR GRC HRV HUN IRL ISL ITA LIE LTU LUX LVA MDA MKD MLT MNE NLD NOR POL PRT ROU SRB SVK SVN SWE UKR XKX".split())
FUEL = {"Nuclear":"Nucléaire","Hydro":"Hydraulique","Coal":"Charbon","Gas":"Gaz","Oil":"Fioul","Wind":"Éolien","Solar":"Solaire","Biomass":"Biomasse","Waste":"Déchets","Geothermal":"Géothermie","Petcoke":"Coke de pétrole","Cogeneration":"Cogénération","Storage":"Stockage","Other":"Autre","Wave and Tidal":"Marémotrice"}
pp = []
for r in csv.DictReader(open('gppd.csv', encoding='utf-8')):
    if r['country'] not in EU or r['primary_fuel']=='Nuclear': continue
    cap = float(r['capacity_mw'] or 0)
    if cap < 50: continue
    pp.append({"name":r['name'],"country":r['country_long'],"lat":round(float(r['latitude']),4),"lon":round(float(r['longitude']),4),"fuel":FUEL.get(r['primary_fuel'], r['primary_fuel']),"mw":round(cap)})
out = {"nuclear":nl,"dams":list(dams.values()),"powerplants":pp,
 "meta":{"nuclear":"Wikidata (CC0), requête SPARQL du 2026-09-30 : instances de « centrale nucléaire » (Q134447) situées en Europe","dams":"Wikidata (CC0), 2026-09-30 : barrages (Q12323) en Europe avec hauteur renseignée ≥ 50 m — couverture incomplète","powerplants":"WRI Global Power Plant Database v1.3.0 (CC BY 4.0), centrales ≥ 50 MW hors nucléaire — données figées en 2021"}}
json.dump(out, open('poi_europe.json','w'), ensure_ascii=False, separators=(',',':'))
print(len(nl), len(dams), len(pp)); import collections; print(collections.Counter(e['state'] for e in nl).most_common(8))
