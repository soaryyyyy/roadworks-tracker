-- Script de réinitialisation complète de la base de données
-- ATTENTION: Ceci supprimera TOUTES les données!

-- Supprimer les tables dans l'ordre des dépendances
DROP TABLE IF EXISTS signalement_work CASCADE;
DROP TABLE IF EXISTS signalement_status CASCADE;
DROP TABLE IF EXISTS signalement_photo CASCADE;
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
  name VARCHAR(150) NOT NULL,
  siret VARCHAR(30) NOT NULL UNIQUE,
  address VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(150),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE config (
    id BIGSERIAL PRIMARY KEY,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    session_duration INTEGER NOT NULL DEFAULT 60
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

CREATE TABLE IF NOT EXISTS signalement_photo (
    id BIGSERIAL PRIMARY KEY,
    id_signalement BIGINT NOT NULL,
    photo_data TEXT NOT NULL,
    photo_order INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_signalement_photo_signalement
        FOREIGN KEY (id_signalement)
        REFERENCES signalement(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_signalement_photo_signalement_id
    ON signalement_photo(id_signalement);

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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_account BIGINT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(64),
    user_agent TEXT
);

CREATE TABLE account_status (
    id BIGSERIAL PRIMARY KEY,
    id_account BIGINT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    status_label VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
-- Migration: Ajouter la table security_log pour les logs d'accès aux signalements

CREATE TABLE IF NOT EXISTS security_log (
    id SERIAL PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(100),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id BIGINT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_security_log_user_id ON security_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_log_action ON security_log(action);
CREATE INDEX IF NOT EXISTS idx_security_log_created_at ON security_log(created_at);
CREATE INDEX IF NOT EXISTS idx_security_log_resource ON security_log(resource_type, resource_id);


-- Créer les index
CREATE INDEX idx_signalement_account ON signalement(id_account);
CREATE INDEX idx_signalement_type ON signalement(id_type_problem);
CREATE INDEX idx_signalement_firebase_id ON signalement(firebase_id);
CREATE INDEX idx_signalement_status_signalement ON signalement_status(id_signalement);
CREATE INDEX idx_signalement_work_signalement ON signalement_work(id_signalement);
CREATE INDEX idx_session_account ON session(id_account);



-- Insérer les données de référence (seulement utilisateur et manager)
INSERT INTO role (libelle) VALUES ('utilisateur'), ('manager');
INSERT INTO status_signalement (libelle) VALUES ('nouveau'), ('en_cours'), ('terminé'), ('annulé');
INSERT INTO type_problem (libelle, icone) VALUES
    ('Danger', '⚠️'),
    ('Travaux', '🚧'),
    ('Risque', '⚡'),
    ('Inondation', '💧'),
    ('Résolu', '✅'),
    ('Route fermée', '🚫'),
    -- Types Firebase (mobile)
    ('pothole', '🕳️'),
    ('blocked_road', '🚧'),
    ('accident', '🚨'),
    ('construction', '🏗️'),
    ('flooding', '💧'),
    ('debris', '🪨'),
    ('poor_surface', '⚠️'),
    ('other', '❓');
    

-- Insérer l'utilisateur admin par défaut (rôle manager = id 2)
-- Mot de passe: admin123 (hashé avec SHA-256 + Base64)
INSERT INTO account (username, pwd, id_role, is_active)
VALUES ('admin', 'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIKk=', 2, TRUE);
INSERT INTO company (id, name, siret, address, phone, email) VALUES
  (1, 'BTP Antananarivo', '12345678900010', '1 Rue de l''Independance', '+26120202020', 'contact@btp-ants.com'),
  (2, 'Reseaux Urbains', '98765432100011', '12 Avenue de France', '+26120202021', 'info@reseaux-urbains.mg');

-- Configuration par défaut
INSERT INTO config (max_attempts, session_duration) VALUES (5, 60);


INSERT INTO signalement (id_account, id_type_problem, descriptions, location, created_at) 
VALUES 
  (1, 1, 'Nid de poule dangereux rue de la République', '-18.8792,47.5079', NOW());

