package dev.workingstate;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
class TaskStore {
    private final JdbcClient jdbc;

    TaskStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    Task create(String title, String description) {
        String id = UUID.randomUUID().toString();
        jdbc.sql("""
                INSERT INTO tasks (id, title, description, status, version)
                VALUES (:id, :title, :description, 'todo', 1)
                """)
                .param("id", id)
                .param("title", title)
                .param("description", description, Types.VARCHAR)
                .update();
        return new Task(id, title, description, "todo", 1, List.of());
    }

    @Transactional
    Task get(String id) {
        Task task = jdbc.sql("SELECT id, title, description, status, version FROM tasks WHERE id = :id")
                .param("id", id)
                .query((row, number) -> new Task(row.getString("id"), row.getString("title"),
                        row.getString("description"), row.getString("status"), row.getLong("version"), List.of()))
                .optional()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task was not found."));
        List<Note> activity = jdbc.sql("""
                SELECT id, task_id, body, author_id, author_name, author_type, created_at
                FROM task_activity
                WHERE task_id = :taskId
                ORDER BY created_at DESC, sequence DESC
                """)
                .param("taskId", id)
                .query((row, number) -> new Note(row.getString("id"), row.getString("task_id"), row.getString("body"),
                        author(row), Instant.ofEpochMilli(row.getLong("created_at"))))
                .list();
        return new Task(task.id(), task.title(), task.description(), task.status(), task.version(), activity);
    }

    @Transactional
    Task updateStatus(String id, String status, long expectedVersion) {
        int updated = jdbc.sql("""
                UPDATE tasks SET status = :status, version = version + 1
                WHERE id = :id AND version = :version
                """)
                .param("status", status)
                .param("id", id)
                .param("version", expectedVersion)
                .update();
        Task task = get(id);
        if (updated == 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Task version changed. Fetch the task before retrying.");
        }
        return task;
    }

    Note appendNote(String taskId, String body, WorkspaceIdentity author) {
        String id = UUID.randomUUID().toString();
        Instant createdAt = Instant.ofEpochMilli(System.currentTimeMillis());
        int inserted = jdbc.sql("""
                INSERT INTO task_activity (id, task_id, body, author_id, author_name, author_type, created_at)
                SELECT :id, tasks.id, :body, :authorId, :authorName, :authorType, :createdAt
                FROM tasks WHERE tasks.id = :taskId
                """)
                .param("id", id)
                .param("taskId", taskId)
                .param("body", body)
                .param("authorId", author.id())
                .param("authorName", author.name())
                .param("authorType", author.type())
                .param("createdAt", createdAt.toEpochMilli())
                .update();
        if (inserted == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Task was not found.");
        }
        return new Note(id, taskId, body, author, createdAt);
    }

    List<RecentNote> recentNotes(int limit) {
        return jdbc.sql("""
                SELECT activity.id, activity.task_id, task.title AS task_title, activity.body,
                       activity.author_id, activity.author_name, activity.author_type, activity.created_at
                FROM task_activity AS activity
                JOIN tasks AS task ON task.id = activity.task_id
                ORDER BY activity.created_at DESC, activity.sequence DESC
                LIMIT :limit
                """)
                .param("limit", limit)
                .query((row, number) -> new RecentNote(row.getString("id"), row.getString("task_id"),
                        row.getString("task_title"), excerpt(row.getString("body")), author(row),
                        Instant.ofEpochMilli(row.getLong("created_at"))))
                .list();
    }

    private static WorkspaceIdentity author(ResultSet row) throws SQLException {
        return new WorkspaceIdentity(row.getString("author_id"), row.getString("author_name"),
                row.getString("author_type"));
    }

    private static String excerpt(String body) {
        String line = body.replaceAll("(?U)\\s+", " ").strip();
        int maxLength = 160;
        return line.codePointCount(0, line.length()) <= maxLength
                ? line
                : line.substring(0, line.offsetByCodePoints(0, maxLength - 1)).stripTrailing() + "…";
    }

    record Task(String id, String title, String description, String status, long version, List<Note> activity) {}

    record Note(String id, String taskId, String body, WorkspaceIdentity author, Instant createdAt) {}

    record RecentNote(String id, String taskId, String taskTitle, String excerpt, WorkspaceIdentity author,
                      Instant createdAt) {}
}
