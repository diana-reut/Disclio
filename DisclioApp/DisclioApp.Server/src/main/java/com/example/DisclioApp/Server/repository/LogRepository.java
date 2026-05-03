package com.example.DisclioApp.Server.repository;

import com.example.DisclioApp.Server.model.Log;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface LogRepository extends JpaRepository<Log, Integer> {
    long countByUserIdAndTimestampAfter(Integer userId, LocalDateTime time);

    long countByUserIdAndActionInformationAndTimestampAfter(Integer userId, String actionInformation, LocalDateTime time);
}