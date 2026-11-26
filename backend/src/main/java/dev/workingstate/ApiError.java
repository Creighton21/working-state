package dev.workingstate;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

record ApiError(int status, String error, String message) {
    ApiError(HttpStatus status, String message) {
        this(status.value(), status.getReasonPhrase(), message);
    }

    static ResponseEntity<ApiError> response(HttpStatus status, String message) {
        return ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON)
                .body(new ApiError(status, message));
    }
}
