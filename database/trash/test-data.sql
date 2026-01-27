-- Insertion des types de problèmes
INSERT INTO type_problem (icone, libelle) VALUES 
  ('⚠️', 'Danger'),
  ('🚧', 'Travaux'),
  ('⚡', 'Risque'),
  ('💧', 'Inondation'),
  ('✅', 'Résolu'),
  ('🚫', 'Route fermée')
ON CONFLICT (libelle) DO NOTHING;

-- Insérer un compte client test (rôle 2 = client)
INSERT INTO account (username, pwd, id_role, created_at, is_active, is_locked, attempts)
VALUES ('client_test', 'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIKk=', 2, NOW(), true, false, 0)
ON CONFLICT (username) DO NOTHING;

-- Insérer des signalements de test
INSERT INTO signalement (id_account, descriptions, created_at, location, id_type_problem)
VALUES 
  (2, 'Accident grave sur la RN7 avec plusieurs véhicules impliqués', NOW(), 'RN7 - Antananarivo', 1),
  (2, 'Réfection du revêtement routier en cours depuis 2 semaines', NOW(), 'Avenue de l''Indépendance', 2),
  (2, 'Signalisation défectueuse à Analakely - urgence', NOW(), 'Analakely - Antananarivo', 3),
  (2, 'Débordement de l''eau suite aux pluies torrentielles', NOW(), 'Route vers Antsirabe', 4),
  (2, 'Nid de poule important à réparer - très dangereux', NOW(), 'Boulevard de la Réunion', 1),
  (2, 'Fermeture temporaire pour maintenance', NOW(), 'Route d''Ivato', 6);
