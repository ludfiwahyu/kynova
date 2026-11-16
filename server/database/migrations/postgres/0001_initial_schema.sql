-- `IF NOT EXISTS`, because databases created before migrations existed already have these tables.

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    color         TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS members (
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role         TEXT NOT NULL,
    PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS invites (
    token        TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    role         TEXT NOT NULL,
    expires_at   BIGINT NOT NULL
);

-- Synced workspace documents (items, environments, comments) stored as JSON.
CREATE TABLE IF NOT EXISTS docs (
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    entity       TEXT NOT NULL,
    id           TEXT NOT NULL,
    data         TEXT NOT NULL,
    PRIMARY KEY (workspace_id, entity, id)
);
