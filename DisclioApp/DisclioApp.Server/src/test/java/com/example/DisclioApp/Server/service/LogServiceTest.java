package com.example.DisclioApp.Server.service;

import com.example.DisclioApp.Server.model.Log;
import com.example.DisclioApp.Server.repository.LogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LogServiceTest {

    @Mock
    private LogRepository logRepository;

    @InjectMocks
    private LogService logService;

    @Test
    void recordLogCreatesAndSavesLogEntity() {
        ArgumentCaptor<Log> captor = ArgumentCaptor.forClass(Log.class);

        logService.recordLog(5, "ADMIN", "Deleted CD");

        verify(logRepository).save(captor.capture());
        Log saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(5);
        assertThat(saved.getGroupRole()).isEqualTo("ADMIN");
        assertThat(saved.getActionInformation()).isEqualTo("Deleted CD");
        assertThat(saved.getTimestamp()).isNotBlank();
    }

    @Test
    void getAllLogsReturnsRepositoryResults() {
        List<Log> logs = List.of(new Log(1, "USER", "Viewed CD"));
        when(logRepository.findAll()).thenReturn(logs);

        List<Log> result = logService.getAllLogs();

        assertThat(result).containsExactlyElementsOf(logs);
    }
}
