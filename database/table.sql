-- =========================================================
-- Roadworks Tracker - PostgreSQL schema (offline/local DB)
-- =========================================================

-- (Optionnel) Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- 1) ENUMS
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('VISITOR', 'USER', 'MANAGER');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'BLOCKED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signalement_status') THEN
    CREATE TYPE signalement_status AS ENUM ('NOUVEAU', 'EN_COURS', 'TERMINE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signalement_source') THEN
    CREATE TYPE signalement_source AS ENUM ('WEB', 'MOBILE', 'SYNC');
  END IF;
END $$;

-- =========================================================
-- 2) USERS + AUTH
-- =========================================================
CREATE TABLE IF NOT EXISTS app_user (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT NOT NULL UNIQUE,
  password_hash    TEXT, -- utilisé surtout en offline (si Firebase non dispo)
  full_name        TEXT,
  phone            TEXT,
  role             user_role NOT NULL DEFAULT 'USER',
  status           user_status NOT NULL DEFAULT 'ACTIVE',
  failed_attempts  INTEGER NOT NULL DEFAULT 0,
  locked_until     TIMESTAMPTZ NULL,
  last_login_at    TIMESTAMPTZ NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT email_format_chk CHECK (position('@' in email) > 1)
);

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_app_user_role   ON app_user(role);
CREATE INDEX IF NOT EXISTS idx_app_user_status ON app_user(status);

-- Table pour sessions (si vous gérez des sessions côté DB en offline)
CREATE TABLE IF NOT EXISTS auth_session (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_session_user ON auth_session(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_session_exp  ON auth_session(expires_at);

-- Historique des tentatives de connexion (audit simple)
CREATE TABLE IF NOT EXISTS login_attempt (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES app_user(id) ON DELETE SET NULL,
  email       TEXT NOT NULL,
  success     BOOLEAN NOT NULL,
  ip_addr     INET NULL,
  user_agent  TEXT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempt_email ON login_attempt(email);
CREATE INDEX IF NOT EXISTS idx_login_attempt_user  ON login_attempt(user_id);

-- =========================================================
-- 3) ENTREPRISE (optionnel mais propre)
-- =========================================================
CREATE TABLE IF NOT EXISTS entreprise (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  phone       TEXT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- 4) SIGNALEMENTS (problèmes routiers)
-- =========================================================
CREATE TABLE IF NOT EXISTS signalement (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude         DOUBLE PRECISION NOT NULL,
  longitude        DOUBLE PRECISION NOT NULL,
  date_signalement TIMESTAMPTZ NOT NULL DEFAULT now(),

  status           signalement_status NOT NULL DEFAULT 'NOUVEAU',
  surface_m2       NUMERIC(12,2) NULL,
  budget           NUMERIC(14,2) NULL,

  entreprise_id    UUID NULL REFERENCES entreprise(id) ON DELETE SET NULL,
  entreprise_name  TEXT NULL, -- utile si pas d'entreprise normalisée

  created_by       UUID NULL REFERENCES app_user(id) ON DELETE SET NULL,
  source           signalement_source NOT NULL DEFAULT 'MOBILE',

  -- champs sync
  external_id      TEXT NULL,         -- id Firebase ou autre
  synced           BOOLEAN NOT NULL DEFAULT FALSE,
  synced_at        TIMESTAMPTZ NULL,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- contraintes coordonnées (approx)
  CONSTRAINT lat_chk CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT lon_chk CHECK (longitude BETWEEN -180 AND 180)
);

CREATE INDEX IF NOT EXISTS idx_signalement_status     ON signalement(status);
CREATE INDEX IF NOT EXISTS idx_signalement_createdby  ON signalement(created_by);
CREATE INDEX IF NOT EXISTS idx_signalement_synced     ON signalement(synced);
CREATE INDEX IF NOT EXISTS idx_signalement_externalid ON signalement(external_id);

-- =========================================================
-- 5) HISTORIQUE DES CHANGEMENTS DE STATUT (optionnel)
-- =========================================================
CREATE TABLE IF NOT EXISTS signalement_status_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signalement_id UUID NOT NULL REFERENCES signalement(id) ON DELETE CASCADE,
  old_status     signalement_status NULL,
  new_status     signalement_status NOT NULL,
  changed_by     UUID NULL REFERENCES app_user(id) ON DELETE SET NULL,
  changed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  note           TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_sig_status_hist_sig ON signalement_status_history(signalement_id);

-- =========================================================
-- 6) TABLE DE CONFIG (tentatives max, session TTL, etc.)
-- =========================================================
CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Valeurs par défaut demandées par le sujet :
-- max tentatives = 3 (paramétrable)
INSERT INTO app_config(key, value) VALUES
  ('MAX_LOGIN_ATTEMPTS', '3'),
  ('LOCK_MINUTES', '15'),
  ('SESSION_TTL_MINUTES', '30')
ON CONFLICT (key) DO NOTHING;

-- =========================================================
-- 7) TRIGGER updated_at (générique)
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_app_user_updated_at') THEN
    CREATE TRIGGER trg_app_user_updated_at
    BEFORE UPDATE ON app_user
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_signalement_updated_at') THEN
    CREATE TRIGGER trg_signalement_updated_at
    BEFORE UPDATE ON signalement
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- =========================================================
-- 8) PROCÉDURE DB : Débloquer un utilisateur (API REST appellera ça)
-- =========================================================
CREATE OR REPLACE FUNCTION unlock_user(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE app_user
  SET status = 'ACTIVE',
      failed_attempts = 0,
      locked_until = NULL,
      updated_at = now()
  WHERE lower(email) = lower(p_email);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN (v_updated > 0);
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 9) SEED : créer le compte manager par défaut
-- =========================================================
-- IMPORTANT : Remplace password_hash par un hash généré côté backend (bcrypt/argon2)
-- Ici on met un placeholder volontairement.
INSERT INTO app_user(email, password_hash, full_name, role, status)
VALUES ('manager@roadworks.local', '$2b$10$REPLACE_WITH_BCRYPT_HASH', 'Default Manager', 'MANAGER', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;
