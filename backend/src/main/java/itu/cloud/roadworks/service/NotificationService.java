package itu.cloud.roadworks.service;

import itu.cloud.roadworks.dto.SignalementNotification;
import itu.cloud.roadworks.model.Signalement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyNewSignalement(Signalement signalement) {
        SignalementNotification notification = SignalementNotification.builder()
                .type("NEW_SIGNALEMENT")
                .signalementId(signalement.getId())
                .typeProblem(signalement.getTypeProblem().getLibelle())
                .location(signalement.getLocation())
                .description(signalement.getDescriptions())
                .timestamp(Instant.now())
                .message("Nouveau signalement: " + signalement.getTypeProblem().getLibelle())
                .build();

        sendNotification(notification);
    }

    public void notifyStatusUpdated(Signalement signalement, String newStatus) {
        SignalementNotification notification = SignalementNotification.builder()
                .type("STATUS_UPDATED")
                .signalementId(signalement.getId())
                .typeProblem(signalement.getTypeProblem().getLibelle())
                .location(signalement.getLocation())
                .status(newStatus)
                .timestamp(Instant.now())
                .message("Statut mis à jour: " + newStatus)
                .build();

        sendNotification(notification);
    }

    public void notifyWorkAdded(Signalement signalement, String companyName) {
        SignalementNotification notification = SignalementNotification.builder()
                .type("WORK_ADDED")
                .signalementId(signalement.getId())
                .typeProblem(signalement.getTypeProblem().getLibelle())
                .location(signalement.getLocation())
                .timestamp(Instant.now())
                .message("Travaux assignés à: " + companyName)
                .build();

        sendNotification(notification);
    }

    public void notifySyncCompleted(int count) {
        SignalementNotification notification = SignalementNotification.builder()
                .type("SYNC_COMPLETED")
                .timestamp(Instant.now())
                .message(count + " nouveaux signalements synchronisés depuis Firebase")
                .build();

        sendNotification(notification);
    }

    private void sendNotification(SignalementNotification notification) {
        log.info("Envoi notification WebSocket: {}", notification.getMessage());
        messagingTemplate.convertAndSend("/topic/signalements", notification);
    }
}
