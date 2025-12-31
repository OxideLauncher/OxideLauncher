-- Add accent_color setting with orange as default
ALTER TABLE settings ADD COLUMN accent_color TEXT NOT NULL DEFAULT 'orange';
