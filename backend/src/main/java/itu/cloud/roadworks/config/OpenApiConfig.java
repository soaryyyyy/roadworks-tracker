package itu.cloud.roadworks.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
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
                                # API de Suivi des Travaux Routiers

                                API REST complète pour la gestion des signalements de travaux routiers et incidents à Madagascar.

                                ## Fonctionnalités principales

                                | Module | Description |
                                |--------|-------------|
                                | **Authentification** | Connexion, inscription, gestion des sessions avec verrouillage après 3 tentatives |
                                | **Signalements** | Création, suivi et gestion des incidents routiers |
                                | **Entreprises** | Gestion des entreprises de BTP responsables des réparations |
                                | **Firebase** | Synchronisation bidirectionnelle avec Firebase (Firestore + Auth) |
                                | **WebSocket** | Notifications temps réel des nouveaux signalements |

                                ## Authentification

                                Tous les endpoints sauf `/api/auth/login` et `/api/auth/register` nécessitent un token Bearer.

                                1. Obtenez un token via `POST /api/auth/login`
                                2. Incluez le token dans le header: `Authorization: Bearer <token>`

                                ## Statuts des signalements

                                - `nouveau` - Signalement initial, en attente de traitement
                                - `en_cours` - Travaux de réparation en cours
                                - `resolu` - Problème résolu, travaux terminés
                                - `rejete` - Signalement rejeté (doublon, non valide, etc.)

                                ## Projet académique

                                Développé dans le cadre du cours **Cloud Computing S5** - ITU Madagascar, Promotion 17.
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Équipe Roadworks Tracker - ITU P17")
                                .url("https://github.com/soaryyyyy/roadworks-tracker")
                                .email("contact@roadworks.itu"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .externalDocs(new ExternalDocumentation()
                        .description("Documentation complète du projet")
                        .url("https://github.com/soaryyyyy/roadworks-tracker/blob/main/README.md"))
                .tags(List.of(
                        new Tag()
                                .name("Authentification")
                                .description("Gestion de l'authentification, sessions et utilisateurs"),
                        new Tag()
                                .name("Signalements")
                                .description("Gestion des signalements d'incidents et travaux routiers"),
                        new Tag()
                                .name("Entreprises")
                                .description("Gestion des entreprises responsables des réparations")
                ))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Serveur de développement local"),
                        new Server()
                                .url("http://host.docker.internal:" + serverPort)
                                .description("Serveur Docker")
                ))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("UUID")
                                .description("""
                                        Token d'authentification Bearer.

                                        **Format**: UUID-UUID (ex: 550e8400-e29b-41d4-a716-446655440000-123e4567-e89b-12d3-a456-426614174000)

                                        **Obtention**: POST /api/auth/login avec username et password

                                        **Durée de validité**: Configurable (par défaut 24h)
                                        """)))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
