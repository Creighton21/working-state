package dev.workingstate;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
class BrowserRoutes {
    @GetMapping({"/", "/tasks/{taskId}"})
    String workspace() {
        return "forward:/index.html";
    }
}
