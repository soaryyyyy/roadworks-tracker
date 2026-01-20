package itu.cloud.roadworks.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import itu.cloud.roadworks.dto.AuthResponse;
import itu.cloud.roadworks.dto.LoginRequest;
import itu.cloud.roadworks.dto.RegisterRequest;
import itu.cloud.roadworks.model.Account;
import itu.cloud.roadworks.model.Role;
import itu.cloud.roadworks.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "API de gestion de l'authentification et des utilisateurs")
public class AuthApi {

    private final AuthService authService;

    @Operation(
            summary = "Connexion utilisateur",
            description = "Authentifie un utilisateur avec son nom d'utilisateur et mot de passe. " +
                    "Retourne un token de session en cas de succès. " +
                    "Le compte est bloqué après 5 tentatives échouées."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Connexion réussie",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Identifiants invalides ou compte bloqué",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))
            )
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        AuthResponse response = authService.login(request, ipAddress, userAgent);

        if (response.getToken() == null) {
            return ResponseEntity.badRequest().body(response);
        }

        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Inscription utilisateur",
            description = "Crée un nouveau compte utilisateur avec le rôle spécifié"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Inscription réussie",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Nom d'utilisateur déjà existant ou données invalides",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))
            )
    })
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);

        if (response.getToken() == null && response.getUsername() == null) {
            return ResponseEntity.badRequest().body(response);
        }

        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Déconnexion",
            description = "Invalide le token de session de l'utilisateur"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Déconnexion réussie")
    })
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @Parameter(description = "Token Bearer d'authentification", required = true)
            @RequestHeader("Authorization") String token) {
        String cleanToken = token.replace("Bearer ", "");
        authService.logout(cleanToken);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Validation du token",
            description = "Vérifie si le token de session est valide et non expiré"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Token valide",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Token invalide ou expiré",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))
            )
    })
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/validate")
    public ResponseEntity<AuthResponse> validateToken(
            @Parameter(description = "Token Bearer d'authentification", required = true)
            @RequestHeader("Authorization") String token) {
        String cleanToken = token.replace("Bearer ", "");

        return authService.validateToken(cleanToken)
                .map(account -> ResponseEntity.ok(AuthResponse.builder()
                        .username(account.getUsername())
                        .role(account.getRole().getLibelle())
                        .token(cleanToken)
                        .message("Token valide")
                        .build()))
                .orElse(ResponseEntity.status(401).body(AuthResponse.builder()
                        .message("Token invalide ou expiré")
                        .build()));
    }

    @Operation(
            summary = "Liste des rôles",
            description = "Récupère la liste de tous les rôles disponibles dans le système"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Liste des rôles récupérée avec succès",
                    content = @Content(mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = RoleResponse.class)))
            )
    })
    @GetMapping("/roles")
    public ResponseEntity<List<Map<String, Object>>> getRoles() {
        List<Role> roles = authService.getAllRoles();
        List<Map<String, Object>> result = roles.stream()
                .map(role -> Map.<String, Object>of(
                        "id", role.getId(),
                        "libelle", role.getLibelle()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @Operation(
            summary = "Liste des utilisateurs",
            description = "Récupère la liste de tous les comptes utilisateurs avec leurs informations"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Liste des utilisateurs récupérée avec succès",
                    content = @Content(mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = UserResponse.class)))
            )
    })
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        List<Account> accounts = authService.getAllUsers();
        List<Map<String, Object>> result = accounts.stream()
                .map(account -> Map.<String, Object>of(
                        "id", account.getId(),
                        "username", account.getUsername(),
                        "role", account.getRole().getLibelle(),
                        "isActive", account.getIsActive(),
                        "isLocked", account.getIsLocked(),
                        "createdAt", account.getCreatedAt().toString()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    // Schemas pour la documentation Swagger
    @Schema(description = "Réponse contenant les informations d'un rôle")
    private record RoleResponse(
            @Schema(description = "Identifiant unique du rôle", example = "1")
            Long id,
            @Schema(description = "Libellé du rôle", example = "manager")
            String libelle
    ) {}

    @Schema(description = "Réponse contenant les informations d'un utilisateur")
    private record UserResponse(
            @Schema(description = "Identifiant unique de l'utilisateur", example = "1")
            Long id,
            @Schema(description = "Nom d'utilisateur", example = "admin")
            String username,
            @Schema(description = "Rôle de l'utilisateur", example = "manager")
            String role,
            @Schema(description = "Indique si le compte est actif", example = "true")
            Boolean isActive,
            @Schema(description = "Indique si le compte est bloqué", example = "false")
            Boolean isLocked,
            @Schema(description = "Date de création du compte", example = "2024-01-15T10:30:00Z")
            String createdAt
    ) {}
}
