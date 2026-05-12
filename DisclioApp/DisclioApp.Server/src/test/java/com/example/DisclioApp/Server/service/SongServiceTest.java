package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.model.CD;
import com.example.DisclioApp.Server.model.Song;
import com.example.DisclioApp.Server.repository.SongRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SongServiceTest {

    @Mock
    private SongRepository songRepository;

    @InjectMocks
    private SongService songService;

    @Test
    void addSongReturnsSavedEntity() {
        Song song = createSong(1, "Track 1", 1);
        when(songRepository.save(song)).thenReturn(song);

        Song result = songService.addSong(song);

        assertThat(result).isSameAs(song);
        verify(songRepository).save(song);
    }

    @Test
    void deleteSongReturnsTrueWhenSongExists() {
        when(songRepository.existsById(10)).thenReturn(true);

        boolean result = songService.deleteSong(10);

        assertThat(result).isTrue();
        verify(songRepository).deleteById(10);
    }

    @Test
    void deleteSongReturnsFalseWhenSongDoesNotExist() {
        when(songRepository.existsById(10)).thenReturn(false);

        boolean result = songService.deleteSong(10);

        assertThat(result).isFalse();
        verify(songRepository, never()).deleteById(10);
    }

    @Test
    void deleteSongsByCdDelegatesToRepository() {
        songService.deleteSongsByCd(12);

        verify(songRepository).deleteByCdId(12);
    }

    @Test
    void getCdCountBySongFrequencyGroupsSongsBySongsPerCd() {
        when(songRepository.findAll()).thenReturn(List.of(
                createSong(1, "A", 1),
                createSong(1, "B", 2),
                createSong(2, "C", 1),
                createSong(3, "D", 1),
                createSong(3, "E", 2),
                createSong(3, "F", 3)
        ));

        Map<Integer, Long> result = songService.getCdCountBySongFrequency();

        assertThat(result).containsExactlyInAnyOrderEntriesOf(Map.of(
                1, 1L,
                2, 1L,
                3, 1L
        ));
    }

    private Song createSong(int cdId, String title, int trackNumber) {
        CD cd = new CD();
        cd.setId(cdId);

        Song song = new Song();
        song.setCd(cd);
        song.setTitle(title);
        song.setDuration("03:00");
        song.setTrackNumber(trackNumber);
        return song;
    }
}
