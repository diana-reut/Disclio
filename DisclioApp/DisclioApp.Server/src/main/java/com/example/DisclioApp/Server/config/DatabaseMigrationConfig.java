package com.example.DisclioApp.Server.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseMigrationConfig {

    @Bean
    CommandLineRunner widenCdPhotoColumn(JdbcTemplate jdbcTemplate) {
        return args -> {
            String dataType = jdbcTemplate.query(
                    """
                    SELECT DATA_TYPE
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'cd_photos'
                      AND COLUMN_NAME = 'photo_url'
                    """
                    ,
                    rs -> rs.next() ? rs.getString("DATA_TYPE") : null
            );

            if (dataType == null) {
                return;
            }

            if (!"nvarchar".equalsIgnoreCase(dataType) && !"varchar".equalsIgnoreCase(dataType)) {
                return;
            }

            Integer maxLength = jdbcTemplate.query(
                    """
                    SELECT CHARACTER_MAXIMUM_LENGTH
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'cd_photos'
                      AND COLUMN_NAME = 'photo_url'
                    """
                    ,
                    rs -> rs.next() ? rs.getInt("CHARACTER_MAXIMUM_LENGTH") : null
            );

            if (maxLength == null || maxLength == -1) {
                return;
            }

            jdbcTemplate.execute("ALTER TABLE cd_photos ALTER COLUMN photo_url NVARCHAR(MAX)");
        };
    }
}
