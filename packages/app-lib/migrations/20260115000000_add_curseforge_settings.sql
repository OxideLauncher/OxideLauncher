-- Add CurseForge API settings
ALTER TABLE settings ADD COLUMN curseforge_api_key TEXT NULL;
ALTER TABLE settings ADD COLUMN default_content_provider TEXT NOT NULL DEFAULT 'modrinth';
