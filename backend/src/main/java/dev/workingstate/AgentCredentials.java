package dev.workingstate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class AgentCredentials {
    private final SecureRandom random = new SecureRandom();
    private final JdbcClient jdbc;

    AgentCredentials(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    IssuedCredential issue(String installationName) {
        jdbc.sql("""
                INSERT INTO agent_installations (id, name) VALUES (:id, :name)
                ON CONFLICT(name) DO NOTHING
                """)
                .param("id", UUID.randomUUID().toString())
                .param("name", installationName)
                .update();
        String installationId = jdbc.sql("SELECT id FROM agent_installations WHERE name = :name")
                .param("name", installationName)
                .query(String.class)
                .single();

        byte[] entropy = new byte[32];
        random.nextBytes(entropy);
        String token = "wst_" + Base64.getUrlEncoder().withoutPadding().encodeToString(entropy);
        String credentialId = UUID.randomUUID().toString();
        jdbc.sql("""
                INSERT INTO agent_credentials (id, installation_id, token_digest, created_at)
                VALUES (:id, :installation, :digest, :time)
                """)
                .param("id", credentialId)
                .param("installation", installationId)
                .param("digest", digest(token))
                .param("time", System.currentTimeMillis())
                .update();
        return new IssuedCredential(installationId, credentialId, token);
    }

    boolean revoke(String credentialId) {
        return jdbc.sql("""
                UPDATE agent_credentials SET revoked_at = COALESCE(revoked_at, :time) WHERE id = :id
                """)
                .param("time", System.currentTimeMillis())
                .param("id", credentialId)
                .update() == 1;
    }

    Optional<WorkspaceIdentity> authenticate(String token) {
        return jdbc.sql("""
                SELECT installation.id, installation.name
                FROM agent_credentials AS credential
                JOIN agent_installations AS installation ON installation.id = credential.installation_id
                WHERE credential.token_digest = :digest AND credential.revoked_at IS NULL
                """)
                .param("digest", digest(token))
                .query((row, number) -> new WorkspaceIdentity(row.getString("id"), row.getString("name"), "agent"))
                .optional();
    }

    private static String digest(String token) {
        try {
            byte[] bytes = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.US_ASCII));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    record IssuedCredential(String installationId, String credentialId, String token) {}
}
