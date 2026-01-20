package itu.cloud.roadworks.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Requête d'inscription d'un nouvel utilisateur")
public class RegisterRequest {

    @Schema(description = "Nom d'utilisateur unique", example = "john_doe", required = true)
    private String username;

    @Schema(description = "Mot de passe de l'utilisateur", example = "securePassword123", required = true)
    private String password;

    @Schema(description = "Rôle de l'utilisateur (utilisateur ou manager)", example = "utilisateur", required = true)
    private String role;
}
