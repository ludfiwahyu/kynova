-- MySQL 8: keys are VARCHAR (TEXT cannot be a key), documents LONGTEXT (TEXT stops at 64 KB),
-- and the binary collation keeps ids, tokens and emails case-sensitive, as on SQLite and PostgreSQL.

CREATE TABLE users (
    id            VARCHAR(64) NOT NULL PRIMARY KEY,
    email         VARCHAR(320) NOT NULL UNIQUE,
    name          VARCHAR(255) NOT NULL,
    color         VARCHAR(32) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    BIGINT NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin;

CREATE TABLE sessions (
    token_hash VARCHAR(128) NOT NULL PRIMARY KEY,
    user_id    VARCHAR(64) NOT NULL,
    expires_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin;

CREATE TABLE workspaces (
    id         VARCHAR(64) NOT NULL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    created_at BIGINT NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin;

CREATE TABLE members (
    workspace_id VARCHAR(64) NOT NULL,
    user_id      VARCHAR(64) NOT NULL,
    role         VARCHAR(16) NOT NULL,
    PRIMARY KEY (workspace_id, user_id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin;

CREATE TABLE invites (
    token        VARCHAR(128) NOT NULL PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL,
    role         VARCHAR(16) NOT NULL,
    expires_at   BIGINT NOT NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin;

-- Synced workspace documents (items, environments, comments) stored as JSON.
CREATE TABLE docs (
    workspace_id VARCHAR(64) NOT NULL,
    entity       VARCHAR(32) NOT NULL,
    id           VARCHAR(100) NOT NULL,
    data         LONGTEXT NOT NULL,
    PRIMARY KEY (workspace_id, entity, id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin;
