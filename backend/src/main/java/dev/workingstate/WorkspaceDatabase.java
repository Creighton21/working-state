package dev.workingstate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.SQLException;
import java.util.List;
import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.sqlite.SQLiteConfig;
import org.sqlite.SQLiteDataSource;

@Configuration(proxyBeanMethods = false)
class WorkspaceDatabase {
    private static final Logger log = LoggerFactory.getLogger(WorkspaceDatabase.class);
    private static final List<String> MIGRATIONS = List.of(
            "V001__tasks.sql",
            "V002__task_activity.sql",
            "V003__agent_credentials.sql",
            "V004__efforts.sql");

    @Bean
    DataSource dataSource(@Value("${workspace.data-dir}") Path dataDirectory) throws IOException, SQLException {
        Path directory = Files.createDirectories(dataDirectory.toAbsolutePath().normalize());
        SQLiteConfig config = new SQLiteConfig();
        config.enforceForeignKeys(true);
        config.setBusyTimeout(5000);
        SQLiteDataSource source = new SQLiteDataSource(config);
        source.setUrl("jdbc:sqlite:" + directory.resolve("workspace.sqlite3"));
        migrate(source);
        return source;
    }

    private void migrate(DataSource source) throws SQLException {
        try (var connection = source.getConnection(); var statement = connection.createStatement()) {
            try (var result = statement.executeQuery("PRAGMA journal_mode = WAL")) {
                if (!result.next() || !"wal".equalsIgnoreCase(result.getString(1))) {
                    throw new SQLException("Could not enable SQLite WAL mode");
                }
            }

            statement.execute("BEGIN IMMEDIATE");
            try {
                int version;
                try (var result = statement.executeQuery("PRAGMA user_version")) {
                    result.next();
                    version = result.getInt(1);
                }
                if (version < 0 || version > MIGRATIONS.size()) {
                    throw new SQLException("Unsupported workspace database version " + version);
                }
                for (int index = version; index < MIGRATIONS.size(); index++) {
                    String migration = MIGRATIONS.get(index);
                    ScriptUtils.executeSqlScript(connection, new ClassPathResource("db/migration/" + migration));
                    statement.execute("PRAGMA user_version = " + (index + 1));
                }
                statement.execute("COMMIT");
                log.info("Workspace database ready at schema version {} ({} migrations applied)",
                        MIGRATIONS.size(), MIGRATIONS.size() - version);
            } catch (SQLException | RuntimeException exception) {
                try {
                    statement.execute("ROLLBACK");
                } catch (SQLException rollbackFailure) {
                    exception.addSuppressed(rollbackFailure);
                }
                throw exception;
            }
        }
    }
}
