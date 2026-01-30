-- Script de réinitialisation complète de la base de données
-- ATTENTION: Ceci supprimera TOUTES les données!

-- Supprimer les tables dans l'ordre des dépendances
DROP TABLE IF EXISTS signalement_work CASCADE;
DROP TABLE IF EXISTS signalement_status CASCADE;
DROP TABLE IF EXISTS signalement CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS account_status CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS company CASCADE;
DROP TABLE IF EXISTS status_signalement CASCADE;
DROP TABLE IF EXISTS type_problem CASCADE;
DROP TABLE IF EXISTS role CASCADE;
DROP TABLE IF EXISTS config CASCADE;

-- Recréer les tables avec la structure originale
CREATE TABLE role (
    id BIGSERIAL PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE status_signalement (
    id BIGSERIAL PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE type_problem (
    id BIGSERIAL PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL UNIQUE,
    icone VARCHAR(50)
);

CREATE TABLE account (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    pwd VARCHAR(255) NOT NULL,
    id_role BIGINT NOT NULL REFERENCES role(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_failed_login TIMESTAMP
);

CREATE TABLE company (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(255),
    email VARCHAR(100),
    phone VARCHAR(20)
);

CREATE TABLE config (
    id BIGSERIAL PRIMARY KEY,
    key_config VARCHAR(100) NOT NULL UNIQUE,
    value VARCHAR(255)
);

CREATE TABLE signalement (
    id BIGSERIAL PRIMARY KEY,
    id_account BIGINT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    id_type_problem BIGINT NOT NULL REFERENCES type_problem(id),
    descriptions TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    location VARCHAR(255) NOT NULL,
    picture TEXT,
    surface NUMERIC(12,2),
    firebase_id VARCHAR(255) UNIQUE
);

CREATE TABLE signalement_status (
    id BIGSERIAL PRIMARY KEY,
    id_signalement BIGINT NOT NULL REFERENCES signalement(id) ON DELETE CASCADE,
    id_status_signalement BIGINT NOT NULL REFERENCES status_signalement(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE signalement_work (
    id BIGSERIAL PRIMARY KEY,
    id_signalement BIGINT NOT NULL REFERENCES signalement(id) ON DELETE CASCADE,
    id_company BIGINT NOT NULL REFERENCES company(id),
    start_date DATE,
    end_date_estimation DATE,
    price NUMERIC(14,2),
    real_end_date DATE
);

CREATE TABLE session (
    id BIGSERIAL PRIMARY KEY,
    id_account BIGINT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    token_value VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE account_status (
    id BIGSERIAL PRIMARY KEY,
    id_account BIGINT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    status_label VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Créer les index
CREATE INDEX idx_signalement_account ON signalement(id_account);
CREATE INDEX idx_signalement_type ON signalement(id_type_problem);
CREATE INDEX idx_signalement_firebase_id ON signalement(firebase_id);
CREATE INDEX idx_signalement_status_signalement ON signalement_status(id_signalement);
CREATE INDEX idx_signalement_work_signalement ON signalement_work(id_signalement);
CREATE INDEX idx_session_account ON session(id_account);

-- Insérer les données de référence
INSERT INTO role (libelle) VALUES ('user'), ('client'), ('manager'), ('admin');
INSERT INTO status_signalement (libelle) VALUES ('nouveau'), ('en_cours'), ('resolu'), ('rejete');
INSERT INTO type_problem (libelle, icone) VALUES 
    ('Danger', '⚠️'),
    ('Travaux', '🚧'),
    ('Risque', '⚡'),
    ('Inondation', '💧'),
    ('Résolu', '✅'),
    ('Route fermée', '🚫');

-- Insérer l'utilisateur admin par défaut
-- Mot de passe: admin123 (hashé avec bcrypt)
INSERT INTO account (username, pwd, id_role, is_active) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVm', 4, TRUE);
