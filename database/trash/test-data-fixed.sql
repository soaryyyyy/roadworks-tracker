-- Insert type_problem (no ON CONFLICT needed since table is empty)
INSERT INTO type_problem (libelle) VALUES 
('Danger'),
('Travaux'),
('Risque'),
('Inondation'),
('Résolu'),
('Route fermée');

-- Insert client_test account (if not already exists)
INSERT INTO account (username, password, role)
SELECT 'client_test', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVm', 2
WHERE NOT EXISTS (SELECT 1 FROM account WHERE username = 'client_test');

-- Insert test signalements with real coordinates (Antananarivo area)
-- Get the account ID to use
WITH account_id AS (
  SELECT id FROM account WHERE username = 'client_test' LIMIT 1
)
INSERT INTO signalement (id_account, id_type_problem, description, latitude, longitude, date_signalement) 
SELECT 
  a.id,
  1, -- Danger
  'Nid de poule dangereux rue de la République',
  -18.8792,
  47.5079,
  NOW()
FROM account_id a

UNION ALL

SELECT 
  (SELECT id FROM account WHERE username = 'client_test'),
  2, -- Travaux
  'Travaux de route en cours Rue de la Cathédrale',
  -18.8818,
  47.5145,
  NOW() - INTERVAL '2 days'

UNION ALL

SELECT 
  (SELECT id FROM account WHERE username = 'client_test'),
  1, -- Danger
  'Dégradation de chaussée route vers Alarobia',
  -18.8650,
  47.5250,
  NOW() - INTERVAL '1 day'

UNION ALL

SELECT 
  (SELECT id FROM account WHERE username = 'client_test'),
  4, -- Inondation
  'Accumulation d''eau sur Rue de Madagascar après pluie',
  -18.8750,
  47.5100,
  NOW() - INTERVAL '3 days'

UNION ALL

SELECT 
  (SELECT id FROM account WHERE username = 'client_test'),
  3, -- Risque
  'Glissement potentiel de terrain Avenue de l''Indépendance',
  -18.8900,
  47.5000,
  NOW() - INTERVAL '5 days'

UNION ALL

SELECT 
  (SELECT id FROM account WHERE username = 'client_test'),
  2, -- Travaux
  'Réparation des lignes électriques Rue Rainizanabona',
  -18.8700,
  47.5300,
  NOW() - INTERVAL '4 days';
