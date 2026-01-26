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

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import itu.cloud.roadworks.dto.SignalementProblemDto;
import itu.cloud.roadworks.service.SignalementService;
import lombok.RequiredArgsConstructor;

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
}
