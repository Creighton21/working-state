package dev.workingstate;

import java.net.URI;
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

    @PostMapping
    ResponseEntity<TaskStore.Task> create(@RequestBody JsonNode request) {
        String title = requiredText(request, "title", "Enter a task title.").strip();
        var description = request.get("description");
        if (description != null && !description.isNull() && !description.isString()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Description must be text.");
        }
        var task = tasks.create(title, description == null || description.isNull() ? null : description.stringValue());
        return ResponseEntity.created(URI.create("/api/v1/tasks/" + task.id())).body(task);
    }

    @GetMapping("/{taskId}")
    TaskStore.Task get(@PathVariable String taskId) {
        return tasks.get(taskId);
    }

    @PatchMapping("/{taskId}")
    TaskStore.Task updateStatus(@PathVariable String taskId, @RequestBody JsonNode request) {
        var status = request.get("status");
        var version = request.get("expectedVersion");
        if (status == null || !status.isString() || !STATUSES.contains(status.stringValue())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Status must be todo, in_progress, or done.");
        }
        if (version == null || !version.isIntegralNumber() || !version.canConvertToLong() || version.longValue() < 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Expected version must be a positive integer.");
        }
        return tasks.updateStatus(taskId, status.stringValue(), version.longValue());
    }

    @PostMapping("/{taskId}/activity")
    @ResponseStatus(HttpStatus.CREATED)
    TaskStore.Note appendNote(@PathVariable String taskId, @RequestBody JsonNode request, Authentication authentication) {
        String body = requiredText(request, "body", "Enter note text.");
        var author = authentication.getPrincipal() instanceof WorkspaceIdentity agent
                ? agent
                : new WorkspaceIdentity("owner", authentication.getName(), "owner");
        return tasks.appendNote(taskId, body, author);
    }

    private static String requiredText(JsonNode request, String field, String message) {
        var value = request.get(field);
        if (value == null || !value.isString()
                || value.stringValue().codePoints().allMatch(character ->
                    Character.isWhitespace(character) || Character.isSpaceChar(character))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, message);
        }
        return value.stringValue();
    }
}
