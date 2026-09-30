import shapefile, json
from shapely.geometry import shape, box, mapping
BB = box(-25, 34, 45, 72)
def rnd(o, p):
    if isinstance(o, (list, tuple)):
        if o and isinstance(o[0], (int, float)): return [round(o[0], p), round(o[1], p)]
        return [rnd(x, p) for x in o]
    return o
def layer(path, props, filt=lambda r: True, tol=0.0, p=3):
    sf = shapefile.Reader(path)
    fields = [f[0] for f in sf.fields[1:]]
    feats = []
    for sr in sf.iterShapeRecords():
        rec = dict(zip(fields, sr.record))
        if not filt(rec): continue
        g = shape(sr.shape.__geo_interface__)
        if not g.intersects(BB): continue
        g = g.intersection(BB)
        if tol: g = g.simplify(tol, preserve_topology=True)
        if g.is_empty: continue
        m = mapping(g)
        feats.append({"type": "Feature", "properties": {k: rec.get(k) for k in props}, "geometry": {"type": m["type"], "coordinates": rnd(json.loads(json.dumps(m["coordinates"])), p)}})
    return {"type": "FeatureCollection", "features": feats}
out = {}
out['countries'] = layer('ne_50m_admin_0_countries/ne_50m_admin_0_countries.shp', ['NAME_FR', 'NAME', 'ISO_A2'], tol=0.01)
out['boundaries'] = layer('ne_10m_admin_0_boundary_lines_land/ne_10m_admin_0_boundary_lines_land.shp', [], tol=0.005)
rv = layer('ne_10m_rivers_lake_centerlines/ne_10m_rivers_lake_centerlines.shp', ['name', 'scalerank'], tol=0.005)
rv2 = layer('ne_10m_rivers_europe/ne_10m_rivers_europe.shp', ['name', 'scalerank'], tol=0.005)
out['rivers'] = {"type": "FeatureCollection", "features": rv['features'] + rv2['features']}
lk = layer('ne_10m_lakes/ne_10m_lakes.shp', ['name'], tol=0.005)
lk2 = layer('ne_10m_lakes_europe/ne_10m_lakes_europe.shp', ['name'], tol=0.005)
out['lakes'] = {"type": "FeatureCollection", "features": lk['features'] + lk2['features']}
out['roads'] = layer('ne_10m_roads/ne_10m_roads.shp', ['type', 'name'], filt=lambda r: r.get('continent') == 'Europe' and r.get('type') in ('Major Highway', 'Secondary Highway'), tol=0.005)
pp = layer('ne_10m_populated_places_simple/ne_10m_populated_places_simple.shp', ['name', 'pop_max', 'adm0name', 'featurecla'], p=4)
out['places'] = pp
for k, v in out.items(): print(k, len(v['features']), len(json.dumps(v, separators=(',', ':'))) // 1024, 'KB')
json.dump(out, open('base_europe.json', 'w'), separators=(',', ':'), ensure_ascii=False)
