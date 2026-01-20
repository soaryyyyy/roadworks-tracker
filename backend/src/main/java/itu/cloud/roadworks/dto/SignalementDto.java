package itu.cloud.roadworks.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import itu.cloud.roadworks.model.Signalement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Détails d'un signalement d'incident routier")
public class SignalementDto {

    @Schema(description = "Identifiant unique du signalement", example = "1")
    private Long id;

    @Schema(description = "Identifiant du compte utilisateur ayant créé le signalement", example = "5")
    private Long accountId;

    @Schema(description = "Nom d'utilisateur ayant créé le signalement", example = "john_doe")
    private String accountUsername;

    @Schema(description = "Description détaillée de l'incident", example = "Nid de poule dangereux sur la voie de droite")
    private String descriptions;

    @Schema(description = "Date et heure de création du signalement", example = "2024-01-15T14:30:00Z")
    private Instant createdAt;

    @Schema(description = "Coordonnées GPS de l'incident (format: latitude,longitude)", example = "-18.8792,47.5079")
    private String location;

    @Schema(description = "URL ou chemin vers la photo de l'incident", example = "/uploads/signalement_123.jpg")
    private String picture;

    @Schema(description = "Surface estimée de l'incident en m²", example = "2.5")
    private BigDecimal surface;

    @Schema(description = "Identifiant du type de problème", example = "1")
    private Long typeProblemId;

    @Schema(description = "Libellé du type de problème", example = "Nid de poule")
    private String typeProblemLibelle;

    public static SignalementDto fromEntity(Signalement entity) {
        return SignalementDto.builder()
                .id(entity.getId())
                .accountId(entity.getAccount() != null ? entity.getAccount().getId() : null)
                .accountUsername(entity.getAccount() != null ? entity.getAccount().getUsername() : null)
                .descriptions(entity.getDescriptions())
                .createdAt(entity.getCreatedAt())
                .location(entity.getLocation())
                .picture(entity.getPicture())
                .surface(entity.getSurface())
                .typeProblemId(entity.getTypeProblem() != null ? entity.getTypeProblem().getId() : null)
                .typeProblemLibelle(entity.getTypeProblem() != null ? entity.getTypeProblem().getLibelle() : null)
                .build();
    }
}
