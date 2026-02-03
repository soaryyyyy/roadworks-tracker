-- ============================================================================
-- SCRIPT SQL FINAL - ROADWORKS TRACKER
-- Base de données PostgreSQL complète
-- Généré le: 2026-02-03
-- ============================================================================

-- ============================================================================
-- PARTIE 1: SUPPRESSION DES TABLES EXISTANTES (ordre des dépendances)
-- ============================================================================

DROP VIEW IF EXISTS signalement_problem_view CASCADE;
DROP TABLE IF EXISTS signalement_work CASCADE;
DROP TABLE IF EXISTS signalement_status CASCADE;
DROP TABLE IF EXISTS signalement_photo CASCADE;
DROP TABLE IF EXISTS signalement CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS account_status CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS company CASCADE;
DROP TABLE IF EXISTS status_signalement CASCADE;
DROP TABLE IF EXISTS status_account CASCADE;
DROP TABLE IF EXISTS type_problem CASCADE;
DROP TABLE IF EXISTS role CASCADE;
DROP TABLE IF EXISTS config CASCADE;
DROP TABLE IF EXISTS security_log CASCADE;
DROP TABLE IF EXISTS advancement_rate CASCADE;

-- ============================================================================
-- PARTIE 2: CRÉATION DES TABLES DE RÉFÉRENCE
-- ============================================================================

-- Table des rôles utilisateurs
CREATE TABLE role (
    id BIGSERIAL PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);

COMMENT ON TABLE role IS 'Table des rôles utilisateurs (manager, utilisateur)';

-- Table des statuts de compte
CREATE TABLE status_account (
    id BIGSERIAL PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);

COMMENT ON TABLE status_account IS 'Table des statuts possibles pour un compte (actif, inactif, bloqué)';

-- Table des statuts de signalement
CREATE TABLE status_signalement (
    id BIGSERIAL PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE
);

COMMENT ON TABLE status_signalement IS 'Table des statuts possibles pour un signalement (nouveau, en_cours, terminé, annulé)';

-- Table des types de problème
CREATE TABLE type_problem (
    id BIGSERIAL PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL UNIQUE,
    icone TEXT
);

COMMENT ON TABLE type_problem IS 'Table des types de problèmes routiers (nid de poule, accident, inondation, etc.)';

-- Table de configuration système
CREATE TABLE config (
    id BIGSERIAL PRIMARY KEY,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    session_duration INTEGER NOT NULL DEFAULT 60
);

COMMENT ON TABLE config IS 'Configuration système (tentatives max de connexion, durée session en minutes)';

-- Table des taux d'avancement par statut
CREATE TABLE advancement_rate (
    id BIGSERIAL PRIMARY KEY,
    status_key VARCHAR(50) NOT NULL,
    percentage INTEGER NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    CONSTRAINT uk_advancement_rate_status UNIQUE (status_key)
);

COMMENT ON TABLE advancement_rate IS 'Pourcentage d avancement associé à chaque statut';

-- ============================================================================
-- PARTIE 3: CRÉATION DES TABLES PRINCIPALES
-- ============================================================================

-- Table des comptes utilisateurs
CREATE TABLE account (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    pwd VARCHAR(255) NOT NULL,
    id_role BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_failed_login TIMESTAMP,
    CONSTRAINT fk_account_role FOREIGN KEY (id_role) REFERENCES role(id)
);

COMMENT ON TABLE account IS 'Table des comptes utilisateurs';

-- Table des statuts de compte (historique)
CREATE TABLE account_status (
    id BIGSERIAL PRIMARY KEY,
    id_account BIGINT NOT NULL,
    id_status_account BIGINT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_account_status_account FOREIGN KEY (id_account) REFERENCES account(id) ON DELETE CASCADE,
    CONSTRAINT fk_account_status_status FOREIGN KEY (id_status_account) REFERENCES status_account(id)
);

COMMENT ON TABLE account_status IS 'Historique des changements de statut des comptes';

-- Table des entreprises de travaux
CREATE TABLE company (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    siret VARCHAR(30) NOT NULL UNIQUE,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE company IS 'Table des entreprises responsables des travaux de réparation';

-- Table des signalements
CREATE TABLE signalement (
    id BIGSERIAL PRIMARY KEY,
    id_account BIGINT NOT NULL,
    id_type_problem BIGINT NOT NULL,
    descriptions TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    location VARCHAR(255) NOT NULL,
    picture TEXT,
    surface NUMERIC(12,2),
    firebase_id VARCHAR(255) UNIQUE,
    CONSTRAINT fk_signalement_account FOREIGN KEY (id_account) REFERENCES account(id) ON DELETE CASCADE,
    CONSTRAINT fk_signalement_type FOREIGN KEY (id_type_problem) REFERENCES type_problem(id)
);

COMMENT ON TABLE signalement IS 'Table principale des signalements de problèmes routiers';
COMMENT ON COLUMN signalement.location IS 'Coordonnées GPS format: latitude,longitude';
COMMENT ON COLUMN signalement.firebase_id IS 'ID du document Firebase pour synchronisation mobile';

-- Table des photos de signalement
CREATE TABLE signalement_photo (
    id BIGSERIAL PRIMARY KEY,
    id_signalement BIGINT NOT NULL,
    photo_data TEXT NOT NULL,
    photo_order INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_signalement_photo_signalement FOREIGN KEY (id_signalement) REFERENCES signalement(id) ON DELETE CASCADE
);

COMMENT ON TABLE signalement_photo IS 'Photos associées aux signalements (Base64 ou URL)';

-- Table des statuts de signalement (historique)
CREATE TABLE signalement_status (
    id BIGSERIAL PRIMARY KEY,
    id_signalement BIGINT NOT NULL,
    id_status_signalement BIGINT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sig_status_signalement FOREIGN KEY (id_signalement) REFERENCES signalement(id) ON DELETE CASCADE,
    CONSTRAINT fk_sig_status_status FOREIGN KEY (id_status_signalement) REFERENCES status_signalement(id)
);

COMMENT ON TABLE signalement_status IS 'Historique des changements de statut des signalements';

-- Table des travaux assignés aux signalements
CREATE TABLE signalement_work (
    id BIGSERIAL PRIMARY KEY,
    id_signalement BIGINT NOT NULL,
    id_company BIGINT NOT NULL,
    start_date DATE,
    end_date_estimation DATE,
    price NUMERIC(14,2),
    real_end_date DATE,
    CONSTRAINT fk_work_signalement FOREIGN KEY (id_signalement) REFERENCES signalement(id) ON DELETE CASCADE,
    CONSTRAINT fk_work_company FOREIGN KEY (id_company) REFERENCES company(id)
);

COMMENT ON TABLE signalement_work IS 'Travaux assignés pour résoudre un signalement';

-- Table des sessions utilisateurs
CREATE TABLE session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_account BIGINT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(64),
    user_agent TEXT,
    CONSTRAINT fk_session_account FOREIGN KEY (id_account) REFERENCES account(id) ON DELETE CASCADE
);

COMMENT ON TABLE session IS 'Sessions de connexion des utilisateurs';

-- Table des logs de sécurité
CREATE TABLE security_log (
    id BIGSERIAL PRIMARY KEY,
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

COMMENT ON TABLE security_log IS 'Logs d audit et de sécurité des actions utilisateurs';

-- ============================================================================
-- PARTIE 4: CRÉATION DES INDEX
-- ============================================================================

CREATE INDEX idx_account_username ON account(username);
CREATE INDEX idx_account_role ON account(id_role);

CREATE INDEX idx_signalement_account ON signalement(id_account);
CREATE INDEX idx_signalement_type ON signalement(id_type_problem);
CREATE INDEX idx_signalement_firebase_id ON signalement(firebase_id);
CREATE INDEX idx_signalement_created_at ON signalement(created_at);

CREATE INDEX idx_signalement_photo_signalement ON signalement_photo(id_signalement);

CREATE INDEX idx_signalement_status_signalement ON signalement_status(id_signalement);
CREATE INDEX idx_signalement_status_updated ON signalement_status(updated_at);

CREATE INDEX idx_signalement_work_signalement ON signalement_work(id_signalement);
CREATE INDEX idx_signalement_work_company ON signalement_work(id_company);

CREATE INDEX idx_session_account ON session(id_account);
CREATE INDEX idx_session_token ON session(token);
CREATE INDEX idx_session_expires ON session(expires_at);

CREATE INDEX idx_security_log_user_id ON security_log(user_id);
CREATE INDEX idx_security_log_action ON security_log(action);
CREATE INDEX idx_security_log_created_at ON security_log(created_at);
CREATE INDEX idx_security_log_resource ON security_log(resource_type, resource_id);

CREATE INDEX idx_account_status_account ON account_status(id_account);

-- ============================================================================
-- PARTIE 5: CRÉATION DE LA VUE SIGNALEMENT_PROBLEM_VIEW
-- ============================================================================

CREATE VIEW signalement_problem_view AS
SELECT
    s.id,
    tp.libelle AS type_problem,
    tp.icone AS illustration_problem,
    s.descriptions,
    s.created_at AS date_problem,
    s.location,
    s.surface AS surface_m2,
    ss.status_label AS etat,
    ss.updated_at AS status_date,
    sw.price AS budget,
    sw.start_date,
    sw.end_date_estimation,
    sw.real_end_date,
    sw.id_company,
    c.name AS company_name
FROM signalement s
JOIN type_problem tp ON s.id_type_problem = tp.id
LEFT JOIN LATERAL (
    SELECT ss_inner.*, st.libelle AS status_label
    FROM signalement_status ss_inner
    JOIN status_signalement st ON ss_inner.id_status_signalement = st.id
    WHERE ss_inner.id_signalement = s.id
    ORDER BY ss_inner.updated_at DESC
    LIMIT 1
) ss ON true
LEFT JOIN LATERAL (
    SELECT sw_inner.*
    FROM signalement_work sw_inner
    WHERE sw_inner.id_signalement = s.id
    ORDER BY sw_inner.start_date DESC NULLS LAST
    LIMIT 1
) sw ON true
LEFT JOIN company c ON sw.id_company = c.id;

COMMENT ON VIEW signalement_problem_view IS 'Vue consolidée des signalements avec leur dernier statut et travail assigné';

-- ============================================================================
-- PARTIE 6: INSERTION DES DONNÉES DE RÉFÉRENCE
-- ============================================================================

-- Rôles utilisateurs
INSERT INTO role (libelle) VALUES 
    ('utilisateur'),
    ('manager');

-- Statuts de compte
INSERT INTO status_account (libelle) VALUES 
    ('actif'),
    ('inactif'),
    ('bloqué');

-- Statuts de signalement
INSERT INTO status_signalement (libelle) VALUES 
    ('nouveau'),
    ('en_cours'),
    ('terminé'),
    ('annulé');

-- Types de problèmes (français + types Firebase mobile)
INSERT INTO type_problem (libelle, icone) VALUES
    -- Types en français
    ('Danger', '⚠️'),
    ('Travaux', '🚧'),
    ('Risque', '⚡'),
    ('Inondation', '💧'),
    ('Résolu', '✅'),
    ('Route fermée', '🚫'),
    ('Nid de poule', '🕳️'),
    ('Glissement de terrain', '🏔️'),
    ('Effondrement de route', '💥'),
    ('Obstacle sur la route', '🚷'),
    ('Marquage usé', '❌'),
    -- Types Firebase (mobile app)
    ('pothole', '🕳️'),
    ('blocked_road', '🚧'),
    ('accident', '🚨'),
    ('construction', '🏗️'),
    ('flooding', '💧'),
    ('debris', '🪨'),
    ('poor_surface', '⚠️'),
    ('other', '❓');

-- Taux d'avancement par statut
INSERT INTO advancement_rate (status_key, percentage) VALUES
    ('nouveau', 0),
    ('new', 0),
    ('en_cours', 50),
    ('in_progress', 50),
    ('terminé', 100),
    ('completed', 100),
    ('annulé', 0),
    ('cancelled', 0);

-- Configuration par défaut
INSERT INTO config (max_attempts, session_duration) VALUES (5, 60);

-- ============================================================================
-- PARTIE 7: INSERTION DES DONNÉES INITIALES
-- ============================================================================

-- Compte administrateur par défaut
-- Mot de passe: admin123 (hashé avec SHA-256 + Base64)
INSERT INTO account (username, pwd, id_role, created_at, is_active, is_locked, attempts)
VALUES ('admin', 'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIKk=', 2, NOW(), TRUE, FALSE, 0);

-- Entreprises de travaux
INSERT INTO company (name, siret, address, phone, email) VALUES
    ('BTP Antananarivo', '12345678900010', '1 Rue de l''Indépendance, Antananarivo', '+261 20 22 202 02', 'contact@btp-antananarivo.mg'),
    ('Réseaux Urbains Madagascar', '98765432100011', '12 Avenue de France, Antananarivo', '+261 20 22 202 03', 'info@reseaux-urbains.mg'),
    ('Travaux Publics Tana', '11223344556677', '45 Boulevard Ratsimandrava', '+261 34 00 000 01', 'contact@tp-tana.mg'),
    ('Madagascar Routes SARL', '99887766554433', 'Lot IVG 123 Analakely', '+261 34 00 000 02', 'contact@mada-routes.mg');

-- ============================================================================
-- PARTIE 8: DONNÉES DE DÉMONSTRATION (OPTIONNEL)
-- ============================================================================

-- Signalement de démonstration
INSERT INTO signalement (id_account, id_type_problem, descriptions, location, created_at, surface) 
VALUES 
    (1, 7, 'Nid de poule dangereux près de l''école, risque pour les piétons', '-18.8792,47.5079', NOW() - INTERVAL '5 days', 2.5),
    (1, 8, 'Route bloquée suite à un éboulement', '-18.9100,47.5200', NOW() - INTERVAL '3 days', 50.0),
    (1, 14, 'Accident signalé - débris sur la chaussée', '-18.8650,47.5150', NOW() - INTERVAL '1 day', NULL);

-- Statuts initiaux des signalements de démonstration
INSERT INTO signalement_status (id_signalement, id_status_signalement, updated_at)
VALUES 
    (1, 2, NOW() - INTERVAL '4 days'),  -- en_cours
    (2, 1, NOW() - INTERVAL '3 days'),  -- nouveau
    (3, 1, NOW() - INTERVAL '1 day');   -- nouveau

-- Travail assigné au premier signalement
INSERT INTO signalement_work (id_signalement, id_company, start_date, end_date_estimation, price)
VALUES 
    (1, 1, CURRENT_DATE - 3, CURRENT_DATE + 4, 150000.00);

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

-- Affichage du résumé
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Base de données ROADWORKS initialisée avec succès!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Tables créées: 14';
    RAISE NOTICE 'Vue créée: signalement_problem_view';
    RAISE NOTICE 'Compte admin: admin / admin123';
    RAISE NOTICE '============================================';
END $$;
