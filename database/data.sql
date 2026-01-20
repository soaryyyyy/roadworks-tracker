-- Seed data for roadworks tracker

INSERT INTO role (libelle) VALUES
  ('visiteur'),
  ('utilisateur'),
  ('manager');

INSERT INTO status_account (libelle) VALUES
  ('actif'),
  ('inactif'),
  ('bloque');

INSERT INTO status_signalement (libelle) VALUES
  ('nouveau'),
  ('en cours'),
  ('termine');

INSERT INTO company (name, siret, address, phone, email)
VALUES
  ('BTP Antananarivo', '12345678900010', '1 Rue de l''Independance', '+26120202020', 'contact@btp-ants.com'),
  ('Reseaux Urbains', '98765432100011', '12 Avenue de France', '+26120202021', 'info@reseaux-urbains.mg');

INSERT INTO type_problem (icone, libelle) VALUES
  ('⚠️', 'Incident'),
  ('🚧', 'Travaux');

INSERT INTO account (username, pwd, id_role, is_active, is_locked, attempts)
VALUES
  ('admin', 'password', 3, TRUE, FALSE, 0),
  ('agent', 'password', 2, TRUE, FALSE, 0);

INSERT INTO account_status (id_account, id_status_account)
VALUES
  (1, 1),
  (2, 1);

INSERT INTO signalement (id_account, descriptions, location, surface, id_type_problem)
VALUES
  (2, 'Rassembler des gravats sur la rue Analakely', 'Analakely', 120.5, 1),
  (2, 'Refection du reseau d''eau entre Isoraka et Lac Anosy', 'Isoraka', 340.7, 2);

INSERT INTO signalement_work (id_signalement, id_company, start_date, end_date_estimation, price)
VALUES
  (1, 1, '2026-01-01', '2026-01-15', 145000.00),
  (2, 2, '2026-01-05', '2026-01-25', 280000.00);

INSERT INTO signalement_status (id_signalement, id_status_signalement)
VALUES
  (1, 2),
  (1, 3),
  (2, 1);
