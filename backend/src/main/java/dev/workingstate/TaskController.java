package dev.workingstate;

import java.net.URI;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/v1/tasks")
class TaskController {
    private static final Set<String> STATUSES = Set.of("todo", "in_progress", "done");
    private final TaskStore tasks;

    TaskController(TaskStore tasks) {
        this.tasks = tasks;
    }

    @GetMapping
    List<TaskStore.TaskSummary> list(@RequestParam String scope) {
        if (!"standalone".equals(scope)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Scope must be standalone.");
        }
        return tasks.listStandalone();
    }

    @PostMapping
    ResponseEntity<TaskStore.Task> create(@RequestBody JsonNode request) {
        String title = WorkspaceRequest.requiredText(request, "title", "Enter a task title.").strip();
        String effortId = request.hasNonNull("effortId") ? effortId(request) : null;
        var task = tasks.create(title, WorkspaceRequest.description(request), effortId);
        return ResponseEntity.created(URI.create("/api/v1/tasks/" + task.id())).body(task);
    }

    @GetMapping("/{taskId}")
    TaskStore.Task get(@PathVariable String taskId) {
        return tasks.get(taskId);
    }

    @PatchMapping("/{taskId}")
    TaskStore.Task updateStatus(@PathVariable String taskId, @RequestBody JsonNode request) {
        var status = request.get("status");
        if (status == null || !status.isString() || !STATUSES.contains(status.stringValue())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Status must be todo, in_progress, or done.");
        }
        return tasks.updateStatus(taskId, status.stringValue(), expectedVersion(request));
    }

    @PatchMapping("/{taskId}/effort")
    TaskStore.Task assignEffort(@PathVariable String taskId, @RequestBody JsonNode request) {
        return tasks.assignEffort(taskId, effortId(request), expectedVersion(request));
    }

    @PostMapping("/{taskId}/activity")
    @ResponseStatus(HttpStatus.CREATED)
    TaskStore.Note appendNote(@PathVariable String taskId, @RequestBody JsonNode request, Authentication authentication) {
        String body = WorkspaceRequest.requiredText(request, "body", "Enter note text.");
        var author = authentication.getPrincipal() instanceof WorkspaceIdentity agent
                ? agent
                : new WorkspaceIdentity("owner", authentication.getName(), "owner");
        return tasks.appendNote(taskId, body, author);
    }

    private static String effortId(JsonNode request) {
        return WorkspaceRequest.requiredText(request, "effortId", "Supply an effort ID.");
    }

    private static long expectedVersion(JsonNode request) {
        var version = request.get("expectedVersion");
        if (version == null || !version.isIntegralNumber() || !version.canConvertToLong() || version.longValue() < 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Expected version must be a positive integer.");
        }
        return version.longValue();
    }
}
