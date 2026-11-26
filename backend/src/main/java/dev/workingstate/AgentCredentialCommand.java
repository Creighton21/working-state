package dev.workingstate;

import org.springframework.boot.Banner;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;

final class AgentCredentialCommand {
    private AgentCredentialCommand() {}

    static int run(String[] args) {
        if (args.length != 3 || !(args[1].equals("issue") || args[1].equals("revoke")) || args[2].isBlank()) {
            System.err.println("Usage: agent issue <installation-name> | agent revoke <credential-id>");
            return 2;
        }

        try (var context = new SpringApplicationBuilder(WorkingStateApplication.class)
                .web(WebApplicationType.NONE).bannerMode(Banner.Mode.OFF).logStartupInfo(false)
                .properties("logging.level.dev.workingstate.WorkspaceDatabase=WARN")
                .run()) {
            AgentCredentials credentials = context.getBean(AgentCredentials.class);
            if (args[1].equals("issue")) {
                var credential = credentials.issue(args[2].strip());
                System.out.println("Installation ID: " + credential.installationId());
                System.out.println("Credential ID: " + credential.credentialId());
                System.out.println("Token: " + credential.token());
                return 0;
            }
            if (credentials.revoke(args[2])) {
                System.out.println("Revoked credential " + args[2]);
                return 0;
            }
            System.err.println("Credential ID was not found.");
            return 1;
        }
    }
}
