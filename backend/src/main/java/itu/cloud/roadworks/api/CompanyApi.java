package itu.cloud.roadworks.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import itu.cloud.roadworks.model.Company;
import itu.cloud.roadworks.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@Tag(name = "Companies", description = "API de gestion des entreprises")
public class CompanyApi {

    private final CompanyRepository repository;

    @Operation(
            summary = "Liste des entreprises",
            description = "Récupère la liste de toutes les entreprises"
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
            summary = "Créer une nouvelle entreprise",
            description = "Ajoute une nouvelle entreprise"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Entreprise créée avec succès"
            )
    })
    @PostMapping
    public Company create(@RequestBody Map<String, String> request) {
        Company company = Company.builder()
                .name(request.get("name"))
                .email(request.get("email"))
                .phone(request.get("phone"))
                .address(request.get("address"))
                .siret(request.get("siret"))
                .build();
        return repository.save(company);
    }
}
