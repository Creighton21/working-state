package dev.workingstate;

import org.springframework.http.HttpStatus;
import tools.jackson.databind.JsonNode;

final class WorkspaceRequest {
    private WorkspaceRequest() {}

    static String requiredText(JsonNode request, String field, String message) {
        var value = request.get(field);
        if (value == null || !value.isString()
                || value.stringValue().codePoints().allMatch(character ->
                    Character.isWhitespace(character) || Character.isSpaceChar(character))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, message);
        }
        return value.stringValue();
    }

    static String description(JsonNode request) {
        var value = request.get("description");
        if (value == null || value.isNull()) return null;
        if (!value.isString()) throw new ApiException(HttpStatus.BAD_REQUEST, "Description must be text.");
        return value.stringValue();
    }
}
