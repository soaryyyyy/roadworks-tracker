package itu.cloud.roadworks.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import itu.cloud.roadworks.dto.SignalementDto;
import itu.cloud.roadworks.service.SignalementService;
import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import itu.cloud.roadworks.dto.SignalementProblemDto;
import itu.cloud.roadworks.service.SignalementService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/signalements")
@RequiredArgsConstructor
@Tag(name = "Signalements", description = "API de gestion des signalements d'incidents routiers")
public class SignalementApi {

    private final SignalementService service;

    @Operation(
            summary = "Liste des signalements",
            description = "Récupère la liste de tous les signalements d'incidents routiers avec leurs détails"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Liste des signalements récupérée avec succès",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = SignalementDto.class))
                    )
            )
    })
    @GetMapping
    public List<SignalementProblemDto> findAll() {
        return service.findAllProblems();
    }

    @Operation(
            summary = "Mettre à jour le statut d'un signalement",
            description = "Met à jour le statut d'un signalement (nouveau, en_cours, resolu, rejete)"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Statut mis à jour avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Signalement non trouvé"
            )
    })
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            service.updateStatus(id, status);
            return ResponseEntity.ok().body(Map.of("message", "Statut mis à jour avec succès"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @Operation(
            summary = "Synchroniser les données depuis Firebase",
            description = "Récupère les signalements depuis Firebase et les insère dans la base de données"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Synchronisation effectuée avec succès"
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Erreur lors de la synchronisation"
            )
    })
    @PostMapping("/sync/firebase")
    public ResponseEntity<?> syncFromFirebase() {
        try {
            int count = service.syncFromFirebase();
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
            description = "Ajoute les détails de réparation et change le statut à en_cours"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Réparation ajoutée avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Signalement non trouvé"
            )
    })
    @PostMapping("/{id}/work")
    public ResponseEntity<?> addWork(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            service.addWork(id, request);
            return ResponseEntity.ok().body(Map.of("message", "Réparation ajoutée avec succès"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @Operation(
            summary = "Synchroniser un signalement vers Firebase",
            description = "Envoie les données d'un signalement (statut, travaux) vers Firebase"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Synchronisation effectuée avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Signalement non trouvé"
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Erreur lors de la synchronisation"
            )
    })
    @PostMapping("/{id}/sync/firebase")
    public ResponseEntity<?> syncToFirebase(@PathVariable Long id) {
        try {
            service.syncToFirebase(id);
            return ResponseEntity.ok().body(Map.of("message", "Synchronisation vers Firebase effectuée avec succès"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
