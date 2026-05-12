package com.example.DisclioApp.Server.repository;

import com.example.DisclioApp.Server.model.CD;
import com.example.DisclioApp.Server.model.Song;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:song-repo;MODE=MSSQLServer;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;NON_KEYWORDS=YEAR",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class SongRepositoryTest {

    @Autowired
    private CDRepository cdRepository;

    @Autowired
    private SongRepository songRepository;

    @Test
    void findByCdIdReturnsOnlySongsForRequestedCd() {
        CD firstCd = cdRepository.save(createCd("First"));
        CD secondCd = cdRepository.save(createCd("Second"));

        songRepository.save(createSong(firstCd, "Track 1", 1));
        songRepository.save(createSong(firstCd, "Track 2", 2));
        songRepository.save(createSong(secondCd, "Other Track", 1));

        List<Song> songs = songRepository.findByCdId(firstCd.getId());

        assertThat(songs)
                .hasSize(2)
                .extracting(Song::getTitle)
                .containsExactlyInAnyOrder("Track 1", "Track 2");
    }

    @Test
    void deleteByCdIdRemovesOnlySongsForThatCd() {
        CD firstCd = cdRepository.save(createCd("First"));
        CD secondCd = cdRepository.save(createCd("Second"));

        songRepository.save(createSong(firstCd, "Track 1", 1));
        songRepository.save(createSong(firstCd, "Track 2", 2));
        songRepository.save(createSong(secondCd, "Other Track", 1));

        songRepository.deleteByCdId(firstCd.getId());

        assertThat(songRepository.findByCdId(firstCd.getId())).isEmpty();
        assertThat(songRepository.findByCdId(secondCd.getId()))
                .extracting(Song::getTitle)
                .containsExactly("Other Track");
    }

    private CD createCd(String title) {
        CD cd = new CD();
        cd.setTitle(title);
        cd.setArtist("Artist");
        cd.setCategory("Category");
        cd.setManufacturer("Manufacturer");
        cd.setYear(2000);
        cd.setCondition("Mint");
        cd.setRating(5);
        cd.setDescription("Test data");
        return cd;
    }

    private Song createSong(CD cd, String title, int trackNumber) {
        Song song = new Song();
        song.setCd(cd);
        song.setTitle(title);
        song.setDuration("03:30");
        song.setTrackNumber(trackNumber);
        return song;
    }
}
