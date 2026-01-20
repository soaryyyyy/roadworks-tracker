package itu.cloud.roadworks.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Requête de connexion utilisateur")
public class LoginRequest {

    @Schema(description = "Nom d'utilisateur", example = "admin", required = true)
    private String username;

    @Schema(description = "Mot de passe de l'utilisateur", example = "manager123", required = true)
    private String password;
}
