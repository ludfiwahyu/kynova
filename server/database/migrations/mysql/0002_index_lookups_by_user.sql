-- Listing a user's workspaces (every page load) and deleting a user's sessions look rows up by user.

CREATE INDEX members_by_user ON members (user_id);
CREATE INDEX sessions_by_user ON sessions (user_id);
