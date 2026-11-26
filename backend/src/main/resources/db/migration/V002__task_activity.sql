CREATE TABLE task_activity (
    sequence INTEGER PRIMARY KEY,
    id TEXT UNIQUE NOT NULL,
    task_id TEXT NOT NULL REFERENCES tasks(id),
    body TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_type TEXT NOT NULL CHECK (author_type IN ('owner', 'agent')),
    created_at INTEGER NOT NULL
);

CREATE INDEX task_activity_by_task ON task_activity(task_id, created_at DESC, sequence DESC);
CREATE INDEX task_activity_by_recency ON task_activity(created_at DESC, sequence DESC);
