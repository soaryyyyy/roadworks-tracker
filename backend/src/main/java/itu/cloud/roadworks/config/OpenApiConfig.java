package itu.cloud.roadworks.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI roadworksOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Roadworks Tracker API")
                        .description("""
                                API complète pour la gestion des signalements de travaux routiers et incidents.
                                
                                Cette API permet de:
                                - Gérer l'authentification des utilisateurs
                                - Créer et gérer les signalements d'incidents routiers
                                - Gérer les entreprises responsables des réparations
                                - Synchroniser les données avec Firebase
                                - Importer les utilisateurs depuis Firebase
                                
                                **Authentification**: Tous les endpoints sauf `/login` et `/register` nécessitent un token Bearer.
                                Obtenez un token en appelant `/api/auth/login` avec vos identifiants.
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Équipe Roadworks Tracker")
                                .url("https://github.com/soaryyyyy/roadworks-tracker")
                                .email("contact@roadworks.itu"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Serveur de développement local"),
                        new Server()
                                .url("http://localhost:8080")
                                .description("Serveur Docker"),
                        new Server()
                                .url("http://localhost:8084")
                                .description("Serveur API (redirection)")
                ))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("UUID")
                                .description("Token d'authentification Bearer (format: UUID-UUID). Obtenu via POST /api/auth/login")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
