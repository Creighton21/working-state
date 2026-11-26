package dev.workingstate;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/v1/efforts")
class EffortController {
    private final EffortStore efforts;

    EffortController(EffortStore efforts) {
        this.efforts = efforts;
    }

    @GetMapping
    List<EffortStore.EffortSummary> list() {
        return efforts.list();
    }

    @PostMapping
    ResponseEntity<EffortStore.Effort> create(@RequestBody JsonNode request) {
        String title = WorkspaceRequest.requiredText(request, "title", "Enter an effort title.").strip();
        var effort = efforts.create(title, WorkspaceRequest.description(request));
        return ResponseEntity.created(URI.create("/api/v1/efforts/" + effort.id())).body(effort);
    }

    @GetMapping("/{effortId}")
    EffortStore.Effort get(@PathVariable String effortId) {
        return efforts.get(effortId);
    }
}
