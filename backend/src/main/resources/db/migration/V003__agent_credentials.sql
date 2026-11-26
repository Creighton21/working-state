CREATE TABLE agent_installations (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE agent_credentials (
    id TEXT PRIMARY KEY NOT NULL,
    installation_id TEXT NOT NULL REFERENCES agent_installations(id),
    token_digest TEXT UNIQUE NOT NULL,
    created_at INTEGER NOT NULL,
    revoked_at INTEGER
);
