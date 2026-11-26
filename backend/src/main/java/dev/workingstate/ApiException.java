package dev.workingstate;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

final class ApiException extends RuntimeException {
    private final HttpStatus status;

    ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    @RestControllerAdvice
    static class Handler {
        @ExceptionHandler(ApiException.class)
        ResponseEntity<ApiError> handle(ApiException exception) {
            return ApiError.response(exception.status, exception.getMessage());
        }
    }
}
