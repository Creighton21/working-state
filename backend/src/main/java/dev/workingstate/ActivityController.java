package dev.workingstate;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
class ActivityController {
    private final TaskStore tasks;

    ActivityController(TaskStore tasks) {
        this.tasks = tasks;
    }

    @GetMapping("/api/v1/activity")
    List<TaskStore.RecentNote> recentActivity(@RequestParam(defaultValue = "3") int limit) {
        if (limit < 1 || limit > 3) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Limit must be between 1 and 3.");
        }
        return tasks.recentNotes(limit);
    }
}
