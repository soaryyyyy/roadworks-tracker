package itu.cloud.roadworks.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Réponse d'authentification")
public class AuthResponse {

    @Schema(description = "Token de session UUID", example = "550e8400-e29b-41d4-a716-446655440000-123e4567-e89b-12d3-a456-426614174000")
    private String token;

    @Schema(description = "Nom d'utilisateur", example = "admin")
    private String username;

    @Schema(description = "Rôle de l'utilisateur", example = "manager")
    private String role;

    @Schema(description = "Message de statut ou d'erreur", example = "Connexion réussie")
    private String message;
}
