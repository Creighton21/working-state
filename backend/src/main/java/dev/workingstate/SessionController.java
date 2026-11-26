package dev.workingstate;

import java.security.Principal;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class SessionController {
    @GetMapping(WorkspaceSecurity.SESSION)
    ResponseEntity<Session> session(Principal principal, CsrfToken token) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(new Session(principal != null, token.getHeaderName(), token.getToken()));
    }

    record Session(boolean signedIn, String csrfHeader, String csrfToken) {}
}
