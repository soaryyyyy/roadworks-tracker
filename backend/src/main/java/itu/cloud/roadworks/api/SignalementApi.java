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
import itu.cloud.roadworks.dto.SignalementDto;
import itu.cloud.roadworks.dto.SignalementPhotoDto;
import itu.cloud.roadworks.dto.SignalementProblemDto;
import itu.cloud.roadworks.service.SecurityLogService;
import itu.cloud.roadworks.service.SignalementService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/signalements")
@RequiredArgsConstructor
@Tag(name = "Signalements", description = "API de gestion des signalements d'incidents et travaux routiers")
public class SignalementApi {

    private final SignalementService service;
    private final SecurityLogService securityLogService;
    private final HttpServletRequest request;

    @Operation(
            summary = "Liste tous les signalements avec détails",
            description = """
                    Récupère la liste complète de tous les signalements d'incidents routiers avec:
                    - Type de problème (nid de poule, inondation, etc.)
                    - Statut actuel (nouveau, en cours, résolu, rejeté)
                    - Entreprise responsable des réparations
                    - Estimations de coût et durée
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Liste des signalements récupérée avec succès",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = SignalementProblemDto.class))
                    )
            )
    })
    @GetMapping
    public List<SignalementProblemDto> findAll() {
        String username = request.getHeader("X-Username");
        securityLogService.logViewAllSignalements(null, username, getClientIp(), request.getHeader("User-Agent"));
        return service.findAllProblems();
    }

    private String getClientIp() {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @Operation(
            summary = "Mettre à jour le statut d'un signalement",
            description = """
                    Change le statut d'un signalement. Les statuts disponibles sont:
                    - nouveau: Signalement initial
                    - en_cours: Réparations en cours
                    - terminé: Problème résolu
                    - annulé: Signalement annulé
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Statut mis à jour avec succès",
                    content = @Content(mediaType = "application/json")
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Signalement non trouvé"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Statut invalide"
            )
    })
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @Parameter(description = "ID du signalement", required = true)
            @PathVariable Long id,
            @Parameter(description = "Nouveau statut (nouveau, en_cours, terminé, annulé) et date réelle de fin optionnelle")
            @RequestBody Map<String, String> requestBody) {
        try {
            String status = requestBody.get("status");
            String realEndDate = requestBody.get("realEndDate");
            service.updateStatus(id, status, realEndDate);
            String username = request.getHeader("X-Username");
            securityLogService.logUpdateStatus(id, null, username, getClientIp(), request.getHeader("User-Agent"));
            return ResponseEntity.ok().body(Map.of("message", "Statut mis à jour avec succès"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @Operation(
            summary = "Synchroniser les données depuis Firebase",
            description = """
                    Récupère tous les signalements depuis Firebase et les insère dans la base de données locale.
                    Les signalements existants ne sont pas dupliqués (détection par firebase_id).
                    """
    )
    
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Synchronisation effectuée avec succès",
                    content = @Content(mediaType = "application/json")
            )
    })
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/sync/firebase")
    public ResponseEntity<?> syncFromFirebase() {
        try {
            int count = service.syncFromFirebase();
            String username = request.getHeader("X-Username");
            securityLogService.logSyncFirebase(null, username, getClientIp(), request.getHeader("User-Agent"));
            return ResponseEntity.ok().body(Map.of(
                    "message", "Synchronisation effectuée avec succès",
                    "imported", count
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @Operation(
            summary = "Ajouter une réparation à un signalement",
            description = """
                    Ajoute les détails de réparation (entreprise, coûts, durées) à un signalement
                    et change automatiquement son statut à "en_cours".
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Réparation ajoutée avec succès",
                    content = @Content(mediaType = "application/json")
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Signalement non trouvé"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données de réparation invalides"
            )
    })
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/{id}/work")
    public ResponseEntity<?> addWork(
            @Parameter(description = "ID du signalement", required = true)
            @PathVariable Long id,
            @Parameter(description = """
                    Données de réparation:
                    - id_company: ID de l'entreprise responsable
                    - start_date: Date de début (YYYY-MM-DD)
                    - end_date_estimation: Date de fin estimée
                    - price: Coût estimé
                    """)
            @RequestBody Map<String, Object> requestBody) {
        try {
            service.addWork(id, requestBody);
            String username = request.getHeader("X-Username");
            securityLogService.logAddWork(id, null, username, getClientIp(), request.getHeader("User-Agent"));
            return ResponseEntity.ok().body(Map.of("message", "Réparation ajoutée avec succès"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @Operation(
            summary = "Synchroniser un signalement vers Firebase",
            description = """
                    Envoie les données d'un signalement (statut, détails de réparation) vers Firebase
                    pour que les citoyens puissent suivre l'avancement des travaux.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Synchronisation effectuée avec succès",
                    content = @Content(mediaType = "application/json")
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Signalement non trouvé"
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Erreur lors de la synchronisation avec Firebase"
            )
    })
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/{id}/sync/firebase")
    public ResponseEntity<?> syncToFirebase(
            @Parameter(description = "ID du signalement à synchroniser", required = true)
            @PathVariable Long id) {
        try {
            service.syncToFirebase(id);
            String username = request.getHeader("X-Username");
            securityLogService.logSyncToFirebase(id, null, username, getClientIp(), request.getHeader("User-Agent"));
            return ResponseEntity.ok().body(Map.of("message", "Synchronisation vers Firebase effectuée avec succès"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @Operation(
            summary = "Récupérer un signalement par ID",
            description = "Récupère les détails complets d'un signalement spécifique"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Signalement récupéré avec succès",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = SignalementProblemDto.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Signalement non trouvé"
            )
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> findById(
            @Parameter(description = "ID du signalement", required = true)
            @PathVariable Long id) {
        String username = request.getHeader("X-Username");
        securityLogService.logViewSignalement(id, null, username, getClientIp(), request.getHeader("User-Agent"));
        return ResponseEntity.ok().body(Map.of("message", "À implémenter"));
    }

    @Operation(
            summary = "Filtrer les signalements par statut",
            description = "Récupère les signalements filtrés par un statut spécifique"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Liste filtrée récupérée avec succès",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = SignalementProblemDto.class))
                    )
            )
    })
    @GetMapping("/status/{status}")
    public ResponseEntity<?> findByStatus(
            @Parameter(description = "Statut à filtrer (nouveau, en_cours, terminé, annulé)", required = true)
            @PathVariable String status) {
        return ResponseEntity.ok().body(Map.of("message", "À implémenter"));
    }

    @Operation(
            summary = "Récupérer les signalements Firebase non synchronisés",
            description = """
                    Récupère la liste des signalements présents dans Firebase mais pas encore importés
                    dans la base de données locale. Utile pour les managers qui veulent voir tous
                    les signalements, y compris ceux en attente de synchronisation.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Liste des signalements non synchronisés récupérée avec succès",
                    content = @Content(mediaType = "application/json")
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Erreur lors de la récupération des données Firebase"
            )
    })
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/firebase/unsynced")
    public ResponseEntity<?> getUnsyncedFirebaseSignalements() {
        try {
            var unsyncedSignalements = service.getUnsyncedFirebaseSignalements();
            String username = request.getHeader("X-Username");
            securityLogService.logViewAllSignalements(null, username, getClientIp(), request.getHeader("User-Agent"));
            return ResponseEntity.ok().body(unsyncedSignalements);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la récupération des signalements Firebase: " + e.getMessage()));
        }
    }

    @Operation(
            summary = "Récupérer les photos d'un signalement",
            description = "Récupère toutes les photos associées à un signalement spécifique, triées par ordre"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Photos récupérées avec succès",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = SignalementPhotoDto.class))
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Signalement non trouvé"
            )
    })
    @GetMapping("/{id}/photos")
    public ResponseEntity<?> getPhotosBySignalementId(
            @Parameter(description = "ID du signalement", required = true)
            @PathVariable Long id) {
        try {
            List<SignalementPhotoDto> photos = service.getPhotosBySignalementId(id);
            return ResponseEntity.ok().body(photos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
