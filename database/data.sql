\c roadworks;
-- Seed data for roadworks tracker (IDs explicit)



INSERT INTO status_account (id, libelle) VALUES
  (1, 'actif'),
  (2, 'inactif'),
  (3, 'bloque');

INSERT INTO role (id, libelle) VALUES
  (1, 'visiteur'),
  (2, 'utilisateur'),
  (3, 'manager');

INSERT INTO status_signalement (id, libelle) VALUES
  (1, 'nouveau'),
  (2, 'en cours'),
  (3, 'termine');

INSERT INTO company (id, name, siret, address, phone, email) VALUES
  (1, 'BTP Antananarivo', '12345678900010', '1 Rue de l''Independance', '+26120202020', 'contact@btp-ants.com'),
  (2, 'Reseaux Urbains', '98765432100011', '12 Avenue de France', '+26120202021', 'info@reseaux-urbains.mg');

INSERT INTO type_problem (id, icone, libelle) VALUES
  (1, '⚠️', 'Incident'),
  (2, '🚧', 'Travaux');


-- Compte manager par défaut (mot de passe: manager123 hashé en SHA-256 Base64)
-- Hash de "manager123" en UTF-8 SHA-256 Base64
INSERT INTO account (id, username, pwd, id_role, is_active, is_locked, attempts)
SELECT 1, 'manager', 'hmSFeWz6jXwM9xEWQCBbgwdkM1R1d1EdgfgDCumezqU=', r.id, true, false, 0
FROM role r WHERE r.libelle = 'manager'
ON CONFLICT (username) DO NOTHING;

-- Création d'un compte manager par défaut
-- Mot de passe: admin123 (hashé en SHA-256 puis encodé en Base64)
INSERT INTO account (id, username, pwd, id_role, created_at, is_active, is_locked, attempts)
VALUES (2, 'admin', 'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIKk=', 1, NOW(), true, false, 0);

INSERT INTO account_status (id, id_account, id_status_account) VALUES
  (1, 1, 1),
  (2, 2, 1);

INSERT INTO signalement (id, id_account, descriptions, location, surface, id_type_problem) VALUES
  (1, 2, 'Rassembler des gravats sur la rue Analakely', 'Analakely', 120.5, 1),
  (2, 2, 'Refection du reseau d''eau entre Isoraka et Lac Anosy', 'Isoraka', 340.7, 2);

INSERT INTO signalement_work (id, id_signalement, id_company, start_date, end_date_estimation, price) VALUES
  (1, 1, 1, '2026-01-01', '2026-01-15', 145000.00),
  (2, 2, 2, '2026-01-05', '2026-01-25', 280000.00);

INSERT INTO signalement_status (id, id_signalement, id_status_signalement) VALUES
  (1, 1, 2),
  (2, 1, 3),
  (3, 2, 1);

-- Configuration par défaut (5 tentatives max, session de 60 minutes)
INSERT INTO config (id, max_attempts, session_duration) VALUES (1, 5, 60);
