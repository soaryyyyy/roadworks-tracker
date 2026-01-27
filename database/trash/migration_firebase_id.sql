-- Migration: Ajouter colonne firebase_id à la table signalement
ALTER TABLE signalement
ADD COLUMN firebase_id VARCHAR(255) UNIQUE;

-- Créer un index pour optimiser les recherches
CREATE INDEX idx_signalement_firebase_id ON signalement(firebase_id);
