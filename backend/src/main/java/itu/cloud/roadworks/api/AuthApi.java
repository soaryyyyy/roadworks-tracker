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
                    "Le compte est bloqué après 3 tentatives échouées (paramétrable)."
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
            summary = "Liste des utilisateurs locaux",
            description = "Récupère la liste de tous les utilisateurs de la base de données locale (PostgreSQL). " +
                    "Cette API est indépendante de Firebase/mobile. Utilisez /api/auth/import-firebase pour synchroniser."
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
        List<Map<String, Object>> result = authService.getAllLocalUsersFormatted();
        return ResponseEntity.ok(result);
    }

    @Operation(
            summary = "Liste des utilisateurs Firebase (Mobile)",
            description = "Récupère la liste de tous les utilisateurs Firebase (application mobile). " +
                    "Utilisé uniquement pour prévisualiser les utilisateurs avant synchronisation."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Liste des utilisateurs Firebase récupérée avec succès",
                    content = @Content(mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = UserResponse.class)))
            )
    })
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/firebase-users")
    public ResponseEntity<List<Map<String, Object>>> getFirebaseUsers() {
        List<Map<String, Object>> result = authService.getAllFirebaseUsersFormatted();
        return ResponseEntity.ok(result);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @Operation(
            summary = "Import des utilisateurs Firebase",
            description = """
                    Importe tous les utilisateurs de Firebase vers la base de données locale.
                    
                    Cette fonction:
                    - Récupère tous les utilisateurs de Firebase
                    - Crée un compte local pour chaque utilisateur (s'il n'existe pas déjà)
                    - Importe le statut des utilisateurs (actif/bloqué)
                    - Assigne le rôle "utilisateur" par défaut
                    - Utilise le UID Firebase comme mot de passe temporaire
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Import réussi",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Non authentifié",
                    content = @Content(mediaType = "application/json")
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Erreur lors de l'import",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))
            )
    })
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/import-firebase")
    public ResponseEntity<AuthResponse> importFromFirebase() {
        AuthResponse response = authService.importUsersFromFirebase();
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Mettre à jour un utilisateur",
            description = """
                    Met à jour les informations d'un utilisateur existant (rôle, mot de passe).
                    - role: nouveau rôle (manager, utilisateur, visiteur)
                    - password: nouveau mot de passe (optionnel, laisser vide pour ne pas modifier)
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Utilisateur mis à jour avec succès",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Non authentifié"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Utilisateur non trouvé"
            )
    })
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/users/{userId}")
    public ResponseEntity<AuthResponse> updateUser(
            @Parameter(description = "ID de l'utilisateur à mettre à jour (ID local ou UID Firebase)", required = true)
            @PathVariable String userId,
            @Parameter(description = "Données de mise à jour (role, password optionnel)")
            @RequestBody Map<String, String> updateData) {
        AuthResponse response = authService.updateUser(userId, updateData);
        if (response.getUsername() == null && response.getMessage().contains("non trouvé")) {
            return ResponseEntity.status(404).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Débloquer un utilisateur local",
            description = "Déverrouille un compte utilisateur bloqué de la base de données locale"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Utilisateur déverrouillé avec succès"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Non authentifié"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Utilisateur non trouvé"
            )
    })
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/users/{userId}/unlock")
    public ResponseEntity<AuthResponse> unlockUser(
            @Parameter(description = "ID de l'utilisateur local à débloquer", required = true)
            @PathVariable Long userId) {
        AuthResponse response = authService.unlockUser(userId);
        if (response.getUsername() == null) {
            return ResponseEntity.status(404).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Débloquer un utilisateur Firebase",
            description = "Déverrouille un compte utilisateur Firebase (mobile) dans Firestore"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Utilisateur Firebase déverrouillé avec succès"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Non authentifié"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Utilisateur non trouvé"
            )
    })
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/firebase-users/{firebaseUid}/unlock")
    public ResponseEntity<AuthResponse> unlockFirebaseUser(
            @Parameter(description = "UID Firebase de l'utilisateur à débloquer", required = true)
            @PathVariable String firebaseUid) {
        AuthResponse response = authService.unlockFirebaseUser(firebaseUid);
        if (response.getUsername() == null) {
            return ResponseEntity.status(404).body(response);
        }
        return ResponseEntity.ok(response);
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
