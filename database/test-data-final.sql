-- Insert test signalements with real coordinates (Antananarivo area)
-- Assuming client_test account already exists or use admin account (id=1)
INSERT INTO signalement (id_account, id_type_problem, descriptions, location, created_at) 
VALUES 
  (1, 1, 'Nid de poule dangereux rue de la République', '-18.8792,47.5079', NOW()),
  (1, 2, 'Travaux de route en cours Rue de la Cathédrale', '-18.8818,47.5145', NOW() - INTERVAL '2 days'),
  (1, 1, 'Dégradation de chaussée route vers Alarobia', '-18.8650,47.5250', NOW() - INTERVAL '1 day'),
  (1, 4, 'Accumulation d''eau sur Rue de Madagascar après pluie', '-18.8750,47.5100', NOW() - INTERVAL '3 days'),
  (1, 3, 'Glissement potentiel de terrain Avenue de l''Indépendance', '-18.8900,47.5000', NOW() - INTERVAL '5 days'),
  (1, 2, 'Réparation des lignes électriques Rue Rainizanabona', '-18.8700,47.5300', NOW() - INTERVAL '4 days');
