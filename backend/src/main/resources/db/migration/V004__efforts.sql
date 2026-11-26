CREATE TABLE efforts (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    description TEXT
);

ALTER TABLE tasks ADD COLUMN effort_id TEXT REFERENCES efforts(id);
CREATE INDEX tasks_by_effort ON tasks(effort_id, title, id);
