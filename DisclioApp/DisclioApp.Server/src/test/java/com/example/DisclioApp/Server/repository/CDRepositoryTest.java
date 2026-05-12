package com.example.DisclioApp.Server.repository;

import com.example.DisclioApp.Server.model.CD;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:cd-repo;MODE=MSSQLServer;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;NON_KEYWORDS=YEAR",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CDRepositoryTest {

    @Autowired
    private CDRepository cdRepository;

    @Test
    void getRatingStatsAggregatesCountsByRating() {
        cdRepository.save(createCd("Blue Train", 5));
        cdRepository.save(createCd("Kind of Blue", 5));
        cdRepository.save(createCd("A Love Supreme", 4));
        cdRepository.save(createCd("Unrated", null));

        List<Object[]> stats = cdRepository.getRatingStats();
        Map<Integer, Long> countsByRating = new HashMap<>();
        long nullRatingCount = 0L;

        for (Object[] row : stats) {
            if (row[0] == null) {
                nullRatingCount = ((Number) row[1]).longValue();
            } else {
                countsByRating.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
            }
        }

        assertThat(stats)
                .hasSize(3);
        assertThat(countsByRating).containsExactlyInAnyOrderEntriesOf(Map.of(5, 2L, 4, 1L));
        assertThat(nullRatingCount).isEqualTo(1L);
    }

    private CD createCd(String title, Integer rating) {
        CD cd = new CD();
        cd.setTitle(title);
        cd.setArtist("Various");
        cd.setCategory("Jazz");
        cd.setManufacturer("Impulse");
        cd.setYear(1960);
        cd.setCondition("Good");
        cd.setRating(rating);
        cd.setDescription("Test data");
        return cd;
    }
}
