-- Listing a user's workspaces (every page load) and deleting a user's sessions look rows up by user.

CREATE INDEX IF NOT EXISTS members_by_user ON members (user_id);
CREATE INDEX IF NOT EXISTS sessions_by_user ON sessions (user_id);
