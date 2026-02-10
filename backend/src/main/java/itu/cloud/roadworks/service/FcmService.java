package itu.cloud.roadworks.service;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.AndroidNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class FcmService {

    private final FirebaseService firebaseService;

    /**
     * Envoie une push notification FCM a l'utilisateur qui a cree le signalement.
     * Flux: firebaseId -> Firestore doc -> userId -> fcm_tokens/{userId} -> token -> FCM send
     */
    public void sendPushToReportOwner(String firebaseId, String title, String body) {
        if (firebaseId == null || firebaseId.isEmpty()) {
            log.warn("Pas de firebaseId - impossible d'envoyer la push notification");
            return;
        }

        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) {
                log.warn("Firestore non initialise - push notification non envoyee");
                return;
            }

            // 1. Lire le document Firestore pour obtenir le userId
            DocumentSnapshot reportDoc = db.collection("roadworks_reports")
                    .document(firebaseId).get().get();

            if (!reportDoc.exists()) {
                log.warn("Document Firestore {} introuvable", firebaseId);
                return;
            }

            String userId = reportDoc.getString("userId");
            if (userId == null || userId.isEmpty()) {
                log.warn("Pas de userId dans le document Firestore {}", firebaseId);
                return;
            }

            // 2. Lire le token FCM depuis la collection fcm_tokens
            DocumentSnapshot tokenDoc = db.collection("fcm_tokens")
                    .document(userId).get().get();

            if (!tokenDoc.exists()) {
                log.warn("Pas de token FCM pour userId {}", userId);
                return;
            }

            String fcmToken = tokenDoc.getString("token");
            if (fcmToken == null || fcmToken.isEmpty()) {
                log.warn("Token FCM vide pour userId {}", userId);
                return;
            }

            // 3. Envoyer la notification FCM
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .setAndroidConfig(AndroidConfig.builder()
                            .setNotification(AndroidNotification.builder()
                                    .setChannelId("status-updates")
                                    .setIcon("ic_launcher")
                                    .build())
                            .build())
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            log.info("Push FCM envoyee avec succes: {}", response);

        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la push FCM pour firebaseId {}: {}",
                    firebaseId, e.getMessage());
        }
    }
}
