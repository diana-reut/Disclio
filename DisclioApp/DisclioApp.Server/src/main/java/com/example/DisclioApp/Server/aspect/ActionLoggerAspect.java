package com.example.DisclioApp.Server.aspect;

import com.example.DisclioApp.Server.model.Log;
import com.example.DisclioApp.Server.model.User;
import com.example.DisclioApp.Server.model.ChatMessage;
import com.example.DisclioApp.Server.model.SuspiciousUser;
import com.example.DisclioApp.Server.repository.LogRepository;
import com.example.DisclioApp.Server.repository.UserRepository;
import com.example.DisclioApp.Server.repository.SuspiciousUserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.Arrays;

@Aspect
@Component
public class ActionLoggerAspect {

    private final LogRepository logRepository;
    private final UserRepository userRepository;
    private final SuspiciousUserRepository suspiciousUserRepository;

    public ActionLoggerAspect(LogRepository logRepository, UserRepository userRepository, SuspiciousUserRepository suspiciousUserRepository) {
        this.logRepository = logRepository;
        this.userRepository = userRepository;
        this.suspiciousUserRepository = suspiciousUserRepository;
    }

    @AfterReturning(pointcut = "execution(* com.example.DisclioApp.Server.controller.*.*(..))", returning = "result")
    public void logUserAction(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().getName();

        if (methodName.equals("getSystemLogs") || methodName.equals("getObservationList")) return;

        Integer userId = 0;
        String role = "SYSTEM";

        if (result instanceof User user) {
            userId = user.getId();
            role = "USER";

            if(user.getRole().getName().equals("ADMIN")){
                role = "ADMIN";
            }
        }

        else {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                if (request.getCookies() != null) {
                    String foundName = Arrays.stream(request.getCookies())
                            .filter(c -> "username".equalsIgnoreCase(c.getName()))
                            .map(Cookie::getValue)
                            .findFirst()
                            .orElse(null);

                    if (foundName != null) {
                        User dbUser = userRepository.findByUsername(foundName).orElse(null);
                        if (dbUser != null) {
                            userId = dbUser.getId();
                            role = "USER";

                            if(dbUser.getRole().getName().equals("ADMIN")){
                                role = "ADMIN";
                            }
                        }
                    }
                }
            }
        }

        if (userId == 0 && joinPoint.getArgs() != null && joinPoint.getArgs().length > 0) {
            Object firstArg = joinPoint.getArgs()[0];

            if (firstArg instanceof ChatMessage chatMsg) {
                String senderName = chatMsg.getSender();

                if (senderName != null) {
                    User dbUser = userRepository.findByUsername(senderName).orElse(null);
                    if (dbUser != null) {
                        userId = dbUser.getId();
                        role = "USER";

                        if(dbUser.getRole().getName().equals("ADMIN")){
                            role = "ADMIN";
                        }
                    }
                }
            }
        }

        Log auditEntry = new Log(userId, role, "ACTION: " + methodName);
        logRepository.save(auditEntry);

        if (userId != 0 && role.equals("USER") && methodName.equals("deleteCD")) {

            if (!suspiciousUserRepository.existsByUserId(userId)) {

                LocalDateTime oneMinuteAgo = LocalDateTime.now().minusMinutes(1);

                long recentDeletions = logRepository.countByUserIdAndActionInformationAndTimestampAfter(
                        userId,
                        "ACTION: deleteCD",
                        oneMinuteAgo
                );

                if (recentDeletions > 20) {

                    String spammerName = userRepository.findById(userId)
                            .map(User::getUsername)
                            .orElse("Unknown");

                    SuspiciousUser flag = new SuspiciousUser(
                            userId,
                            spammerName,
                            "MASS DELETION: Deleted " + recentDeletions + " songs in 60 seconds."
                    );
                    suspiciousUserRepository.save(flag);

                    System.out.println("⚠️ STEALTH ALARM: User " + spammerName + " flagged for mass deletion!");
                }
            }
        }
    }
}