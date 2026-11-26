package dev.workingstate;

import java.security.Principal;

record WorkspaceIdentity(String id, String name, String type) implements Principal {
    @Override
    public String getName() {
        return name;
    }
}
