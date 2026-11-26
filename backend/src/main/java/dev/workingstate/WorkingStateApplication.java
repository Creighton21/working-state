package dev.workingstate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WorkingStateApplication {
    public static void main(String[] args) {
        if (args.length > 0 && args[0].equals("agent")) {
            int status = AgentCredentialCommand.run(args);
            if (status != 0) {
                System.exit(status);
            }
            return;
        }
        SpringApplication.run(WorkingStateApplication.class, args);
    }
}
