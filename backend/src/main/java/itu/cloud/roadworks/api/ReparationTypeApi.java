package itu.cloud.roadworks.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import itu.cloud.roadworks.model.ReparationType;
import itu.cloud.roadworks.repository.ReparationTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reparation-types")
@RequiredArgsConstructor
@Tag(name = "Réparations", description = "API des niveaux/types de réparation")
public class ReparationTypeApi {

    private final ReparationTypeRepository repository;

    @Operation(
            summary = "Liste tous les niveaux de réparation",
            description = "Récupère la liste des niveaux disponibles (table reparation_type)."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Liste récupérée avec succès",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = ReparationType.class))
                    )
            )
    })
    @GetMapping
    public List<ReparationType> findAll() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "niveau"));
    }
}

