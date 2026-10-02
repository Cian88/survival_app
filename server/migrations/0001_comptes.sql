-- Comptes Holdout. Le serveur ne stocke ni mot de passe ni donnée lisible :
-- auth_hash = HMAC de la clé de connexion dérivée sur l'appareil ; vaults.data = sauvegarde chiffrée de bout en bout.
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  auth_salt TEXT,
  auth_hash TEXT,
  apple_refresh TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE identities (
  provider TEXT NOT NULL,
  subject TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (provider, subject)
);
CREATE INDEX identities_user ON identities(user_id);
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device TEXT,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE TABLE email_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE vault_keys (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  keys TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE vaults (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE licences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  plan TEXT,
  exp INTEGER,
  source TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX licences_user ON licences(user_id);
-- Limitation des tentatives (connexion, inscription, e-mails).
CREATE TABLE attempts (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
-- E-mails gardés en base au lieu d'être envoyés (développement et tests uniquement : MAIL_MODE = "outbox").
CREATE TABLE outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_addr TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
