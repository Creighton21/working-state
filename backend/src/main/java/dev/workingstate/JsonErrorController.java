package dev.workingstate;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class JsonErrorController implements ErrorController {
    @RequestMapping("/error")
    ResponseEntity<ApiError> error(HttpServletRequest request) {
        Integer code = (Integer) request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        HttpStatus status = code == null ? HttpStatus.NOT_FOUND : HttpStatus.valueOf(code);
        return ApiError.response(status, status.getReasonPhrase());
    }
}
