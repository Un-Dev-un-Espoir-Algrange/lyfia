-- The Mécènes: of one Secteur and one Année, at a Niveau
CREATE TABLE mecenes (
    mecene_id uuid NOT NULL PRIMARY KEY,
    name varchar(255) NOT NULL,
    niveau varchar(255) NOT NULL CHECK (niveau IN ('OR', 'ARGENT', 'BRONZE')),
    annee integer NOT NULL,
    description text,
    website varchar(255),
    media_id uuid REFERENCES medias (media_id),
    shown boolean NOT NULL,
    sector_id uuid NOT NULL REFERENCES sectors (sector_id),
    created_at timestamp(6) NOT NULL,
    updated_at timestamp(6) NOT NULL,
    updated_by uuid,
    UNIQUE (sector_id, annee, name)
);

-- Its Feature ships on (ADR 0009)
INSERT INTO features (name, description, is_active) VALUES
    ('mecenes', 'Montrer les mécènes au public : la page Nos mécènes et le bandeau de l''accueil.', true)
ON CONFLICT (name) DO NOTHING;
