ALTER TABLE projects ADD COLUMN description text NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN advertisers jsonb NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN completed boolean NOT NULL DEFAULT false;
ALTER TABLE advertisers ADD COLUMN details jsonb NOT NULL DEFAULT '{}';
ALTER TABLE materials ADD COLUMN client_key uuid;
CREATE UNIQUE INDEX materials_client_key ON materials(owner_id,client_key);
