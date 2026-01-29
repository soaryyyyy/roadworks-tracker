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
import itu.cloud.roadworks.model.Company;
import itu.cloud.roadworks.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@Tag(name = "Entreprises", description = "API de gestion des entreprises responsables des réparations")
public class CompanyApi {

    private final CompanyRepository repository;

    @Operation(
            summary = "Liste toutes les entreprises",
            description = """
                    Récupère la liste complète de toutes les entreprises enregistrées dans le système.
                    Chaque entreprise contient ses informations de contact et d'identification.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Liste des entreprises récupérée avec succès",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = Company.class))
                    )
            )
    })
    @GetMapping
    public List<Company> findAll() {
        return repository.findAll();
    }

    @Operation(
            summary = "Récupère une entreprise par ID",
            description = "Récupère les détails d'une entreprise spécifique par son identifiant"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Entreprise récupérée avec succès",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Company.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Entreprise non trouvée"
            )
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> findById(
            @Parameter(description = "ID de l'entreprise", required = true)
            @PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Crée une nouvelle entreprise",
            description = """
                    Ajoute une nouvelle entreprise au système avec ses informations de contact et d'identification.
                    Le SIRET doit être unique dans le système.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Entreprise créée avec succès",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Company.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Données invalides ou SIRET déjà existant"
            )
    })
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping
    public Company create(
            @Parameter(description = "Données de l'entreprise (name, siret, address, email, phone)")
            @RequestBody Map<String, String> request) {
        Company company = Company.builder()
                .name(request.get("name"))
                .email(request.get("email"))
                .phone(request.get("phone"))
                .address(request.get("address"))
                .siret(request.get("siret"))
                .build();
        return repository.save(company);
    }

    @Operation(
            summary = "Met à jour une entreprise",
            description = "Modifie les informations d'une entreprise existante"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Entreprise mise à jour avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Entreprise non trouvée"
            )
    })
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @Parameter(description = "ID de l'entreprise", required = true)
            @PathVariable Long id,
            @Parameter(description = "Données de mise à jour")
            @RequestBody Map<String, String> request) {
        return repository.findById(id)
                .map(company -> {
                    if (request.containsKey("name")) company.setName(request.get("name"));
                    if (request.containsKey("email")) company.setEmail(request.get("email"));
                    if (request.containsKey("phone")) company.setPhone(request.get("phone"));
                    if (request.containsKey("address")) company.setAddress(request.get("address"));
                    return ResponseEntity.ok(repository.save(company));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(
            summary = "Supprime une entreprise",
            description = "Supprime une entreprise du système (opération irréversible)"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Entreprise supprimée avec succès"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Entreprise non trouvée"
            )
    })
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @Parameter(description = "ID de l'entreprise", required = true)
            @PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}

