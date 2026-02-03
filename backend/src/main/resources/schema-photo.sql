-- Script SQL pour créer la table signalement_photo
-- Exécuter ce script sur votre base de données PostgreSQL

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

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_signalement_photo_signalement_id
    ON signalement_photo(id_signalement);
