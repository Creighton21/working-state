package dev.workingstate;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
class EffortStore {
    private static final String PROGRESS_QUERY = """
            SELECT effort.id, effort.title, effort.description,
                   COUNT(task.id) AS total_count,
                   COUNT(CASE WHEN task.status = 'done' THEN 1 END) AS completed_count,
                   COUNT(CASE WHEN task.status = 'todo' THEN 1 END) AS todo_count
            FROM efforts AS effort LEFT JOIN tasks AS task ON task.effort_id = effort.id
            """;
    private static final String GROUP_BY_EFFORT = " GROUP BY effort.id, effort.title, effort.description";

    private final JdbcClient jdbc;
    private final TaskStore tasks;

    EffortStore(JdbcClient jdbc, TaskStore tasks) {
        this.jdbc = jdbc;
        this.tasks = tasks;
    }

    Effort create(String title, String description) {
        String id = UUID.randomUUID().toString();
        jdbc.sql("INSERT INTO efforts (id, title, description) VALUES (:id, :title, :description)")
                .param("id", id)
                .param("title", title)
                .param("description", description, Types.VARCHAR)
                .update();
        return new Effort(id, title, description, "todo", 0, 0, List.of());
    }

    List<EffortSummary> list() {
        return jdbc.sql(PROGRESS_QUERY + GROUP_BY_EFFORT + " ORDER BY effort.title, effort.id")
                .query((row, number) -> summary(row))
                .list();
    }

    @Transactional(readOnly = true)
    Effort get(String id) {
        var members = tasks.listForEffort(id);
        return jdbc.sql(PROGRESS_QUERY + " WHERE effort.id = :id" + GROUP_BY_EFFORT)
                .param("id", id)
                .query((row, number) -> {
                    var summary = summary(row);
                    return new Effort(summary.id(), summary.title(), row.getString("description"),
                            summary.status(), summary.completedCount(), summary.totalCount(), members);
                })
                .optional()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Effort was not found."));
    }

    private static EffortSummary summary(ResultSet row) throws SQLException {
        long total = row.getLong("total_count");
        long completed = row.getLong("completed_count");
        String status = "in_progress";
        if (row.getLong("todo_count") == total) status = "todo";
        else if (completed == total) status = "done";
        return new EffortSummary(row.getString("id"), row.getString("title"), status, completed, total);
    }

    record EffortSummary(String id, String title, String status, long completedCount, long totalCount) {}

    record Effort(String id, String title, String description, String status, long completedCount, long totalCount,
                  List<TaskStore.TaskSummary> tasks) {}
}
