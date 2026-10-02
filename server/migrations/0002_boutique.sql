-- Prix Amazon.fr officiels des objets conseillés (server/src/amazon.js), une ligne par objet et par gamme (« G001.moyen »).
-- price_at : date du prix (affiché moins de 24 h, règle Amazon) ; tried_at : dernière tentative (ordre des mises à jour).
CREATE TABLE shop_prices (
  key TEXT PRIMARY KEY,
  asin TEXT,
  url TEXT,
  title TEXT,
  price REAL,
  currency TEXT,
  price_at INTEGER,
  tried_at INTEGER NOT NULL,
  error TEXT
);
