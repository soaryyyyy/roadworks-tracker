package itu.cloud.roadworks.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.credentials-path:}")
    private String credentialsPath;

    @Bean
    public FirebaseAuth firebaseAuth() throws IOException {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                GoogleCredentials credentials;
                
                if (credentialsPath != null && !credentialsPath.isEmpty()) {
                    // Charger les credentials depuis le fichier spécifié
                    log.info("Initialisation Firebase avec le fichier: {}", credentialsPath);
                    credentials = GoogleCredentials.fromStream(new FileInputStream(credentialsPath));
                } else {
                    // Utiliser les credentials par défaut (variables d'environnement, etc.)
                    log.info("Initialisation Firebase avec les credentials par défaut");
                    credentials = GoogleCredentials.getApplicationDefault();
                }

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .build();

                FirebaseApp.initializeApp(options);
                log.info("Firebase App initialisé avec succès");
            } else {
                log.info("Firebase App déjà initialisé");
            }

            return FirebaseAuth.getInstance();
        } catch (Exception e) {
            log.error("Erreur lors de l'initialisation de Firebase: {}", e.getMessage(), e);
            throw e;
        }
    }
}
