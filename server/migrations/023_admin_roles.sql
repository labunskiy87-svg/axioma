ALTER TABLE users DROP CONSTRAINT IF EXISTS users_team_role_check;
ALTER TABLE users ADD CONSTRAINT users_team_role_check CHECK (team_role IN ('admin','superadmin','moderator','content','finance','viewer'));

ALTER TABLE team_invitations DROP CONSTRAINT IF EXISTS team_invitations_team_role_check;
ALTER TABLE team_invitations ADD CONSTRAINT team_invitations_team_role_check CHECK (team_role IN ('admin','superadmin','moderator','content','finance','viewer'));
