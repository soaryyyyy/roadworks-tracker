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
import itu.cloud.roadworks.model.DefaultPrice;
import itu.cloud.roadworks.repository.DefaultPriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/m2-forfaits")
@RequiredArgsConstructor
@Tag(name = "Forfaits m²", description = "API CRUD du tarif forfaitaire au m² (table default_price)")
public class M2ForfaitApi {

    private final DefaultPriceRepository repository;

    @Operation(summary = "Lister les forfaits m²")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Liste récupérée avec succès",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = DefaultPrice.class))
                    )
            )
    })
    @GetMapping
    public List<DefaultPrice> findAll() {
        return repository.findAll();
    }

    @Operation(summary = "Récupérer le prix forfaitaire courant (dernier)")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Prix courant récupéré",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = DefaultPrice.class))
            ),
            @ApiResponse(responseCode = "404", description = "Aucun prix forfaitaire défini")
    })
    @GetMapping("/current")
    public ResponseEntity<?> current() {
        return repository.findTopByOrderByIdDesc()
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Aucun prix forfaitaire défini")));
    }

    @Operation(summary = "Récupérer un forfait m² par id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Forfait récupéré"),
            @ApiResponse(responseCode = "404", description = "Forfait non trouvé")
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable Long id) {
        return repository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Forfait non trouvé")));
    }

    @Operation(summary = "Créer un forfait m²")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Forfait créé"),
            @ApiResponse(responseCode = "400", description = "Données invalides")
    })
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping
    public ResponseEntity<?> create(
            @Parameter(description = "Données: prixM2 (>0) ou price (>0)")
            @RequestBody Map<String, Object> body
    ) {
        try {
            BigDecimal price = parsePrice(body);
            if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "prixM2 invalide (>0)"));
            }
            DefaultPrice saved = repository.save(DefaultPrice.builder().price(price).build());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @Operation(summary = "Mettre à jour un forfait m²")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Forfait mis à jour"),
            @ApiResponse(responseCode = "404", description = "Forfait non trouvé"),
            @ApiResponse(responseCode = "400", description = "Données invalides")
    })
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return repository.findById(id).map(existing -> {
            BigDecimal price = parsePrice(body);
            if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "prixM2 invalide (>0)"));
            }
            existing.setPrice(price);
            return ResponseEntity.ok(repository.save(existing));
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Forfait non trouvé")));
    }

    @Operation(summary = "Supprimer un forfait m²")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Forfait supprimé"),
            @ApiResponse(responseCode = "404", description = "Forfait non trouvé")
    })
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Forfait non trouvé"));
        }
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Forfait supprimé"));
    }

    private static BigDecimal parsePrice(Map<String, Object> body) {
        Object value = body.containsKey("prixM2") ? body.get("prixM2") : body.get("price");
        if (value == null) return null;
        if (value instanceof Number) return BigDecimal.valueOf(((Number) value).doubleValue());
        if (value instanceof String && !((String) value).trim().isEmpty()) return new BigDecimal(((String) value).trim());
        return null;
    }
}
