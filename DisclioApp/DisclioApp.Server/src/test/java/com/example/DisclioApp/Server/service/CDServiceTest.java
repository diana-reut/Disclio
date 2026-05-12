package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.model.CD;
import com.example.DisclioApp.Server.repository.CDRepository;
import com.example.DisclioApp.Server.repository.SongRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CDServiceTest {

    @Mock
    private CDRepository cdRepository;

    @Mock
    private SongRepository songRepository;

    @InjectMocks
    private CDService cdService;

    @Test
    void addCdSavesEntity() {
        CD cd = createCd("Test", 3);

        cdService.addCD(cd);

        verify(cdRepository).save(cd);
    }

    @Test
    void getCdByIndexReturnsNullWhenMissing() {
        when(cdRepository.findById(42)).thenReturn(Optional.empty());

        CD result = cdService.getCDByIndex(42);

        assertThat(result).isNull();
    }

    @Test
    void deleteCdDeletesAndReturnsEntityWhenFound() {
        CD cd = createCd("Delete Me", 2);
        when(cdRepository.findById(7)).thenReturn(Optional.of(cd));

        CD result = cdService.deleteCD(7);

        assertThat(result).isSameAs(cd);
        verify(cdRepository).delete(cd);
    }

    @Test
    void deleteCdReturnsNullWhenMissing() {
        when(cdRepository.findById(7)).thenReturn(Optional.empty());

        CD result = cdService.deleteCD(7);

        assertThat(result).isNull();
        verify(cdRepository, never()).delete(any());
    }

    @Test
    void updateCdCopiesFieldsAndSavesEntity() {
        CD existing = createCd("Old", 1);
        existing.setPhotos(new java.util.ArrayList<>(List.of("old-photo")));
        CD updated = createCd("New", 5);
        updated.setPhotos(List.of("new-photo"));

        when(cdRepository.findById(3)).thenReturn(Optional.of(existing));
        when(cdRepository.save(existing)).thenReturn(existing);

        CD result = cdService.updateCD(3, updated);

        assertThat(result).isSameAs(existing);
        assertThat(existing.getTitle()).isEqualTo("New");
        assertThat(existing.getRating()).isEqualTo(5);
        assertThat(existing.getPhotos()).containsExactly("new-photo");
        verify(cdRepository).save(existing);
    }

    @Test
    void getRatingDistributionBuildsMapAndSkipsNullRatings() {
        when(cdRepository.getRatingStats()).thenReturn(List.of(
                new Object[]{5, 2L},
                new Object[]{4, 1L},
                new Object[]{null, 3L}
        ));

        Map<Integer, Long> result = cdService.getRatingDistribution();

        assertThat(result).containsExactlyInAnyOrderEntriesOf(Map.of(5, 2L, 4, 1L));
    }

    @Test
    void getPagedCdsUsesRequestedPageAndSize() {
        List<CD> cds = List.of(createCd("One", 1), createCd("Two", 2));
        when(cdRepository.findAll(PageRequest.of(1, 2))).thenReturn(new PageImpl<>(cds));

        List<CD> result = cdService.getPagedCDs(1, 2);

        assertThat(result).containsExactlyElementsOf(cds);
    }

    @Test
    void countDelegatesToRepository() {
        when(cdRepository.count()).thenReturn(9L);

        int result = cdService.count();

        assertThat(result).isEqualTo(9);
        verify(cdRepository).count();
    }

    private CD createCd(String title, Integer rating) {
        CD cd = new CD();
        cd.setTitle(title);
        cd.setArtist("Artist");
        cd.setCategory("Category");
        cd.setManufacturer("Manufacturer");
        cd.setYear(2001);
        cd.setCondition("Good");
        cd.setRating(rating);
        cd.setDescription("Description");
        return cd;
    }
}
