package itu.cloud.roadworks.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@Schema(description = "Signalement d'un problème routier avec tous ses détails")
public class SignalementProblemDto {

    @Schema(description = "Identifiant unique du signalement", example = "1")
    private Long id;

    @Schema(description = "Type de problème signalé", example = "Nid de poule")
    private String typeProblem;

    @Schema(description = "Icône/illustration du type de problème", example = "⚠️")
    private String illustrationProblem;

    @Schema(description = "Coordonnées GPS du signalement (lat,lon)", example = "-18.91,47.52")
    private String location;

    @Schema(description = "Détails complets du signalement")
    private SignalementProblemDetail detail;

    @Schema(description = "Informations sur les travaux assignés")
    private WorkInfo work;

    @Schema(description = "Photos associées au signalement (Base64 ou URLs)")
    private List<String> photos;

    @Data
    @Builder
    @Schema(description = "Détails du problème signalé")
    public static class SignalementProblemDetail {

        @Schema(description = "État actuel du signalement", example = "en_cours", allowableValues = {"nouveau", "en_cours", "resolu", "rejete"})
        private String etat;

        @Schema(description = "Date de signalement du problème", example = "2024-01-15T10:30:00Z")
        private Instant dateProblem;

        @Schema(description = "Surface affectée en mètres carrés", example = "25.50")
        private BigDecimal surfaceM2;

        @Schema(description = "Budget estimé des travaux en Ariary", example = "1500000.00")
        private BigDecimal budget;

        @Schema(description = "Entreprise assignée aux travaux")
        private CompanyDto entrepriseAssign;

        @Schema(description = "Description détaillée du problème", example = "Nid de poule profond sur la voie principale")
        private String description;
    }

    @Data
    @Builder
    @Schema(description = "Informations de l'entreprise")
    public static class CompanyDto {

        @Schema(description = "Identifiant de l'entreprise", example = "1")
        private Long id;

        @Schema(description = "Nom de l'entreprise", example = "TP Madagascar")
        private String name;
    }

    @Data
    @Builder
    @Schema(description = "Informations sur les travaux de réparation")
    public static class WorkInfo {

        @Schema(description = "Date de début des travaux", example = "2024-02-01")
        private String startDate;

        @Schema(description = "Date de fin estimée", example = "2024-02-15")
        private String endDateEstimation;

        @Schema(description = "Date de fin réelle", example = "2024-02-14")
        private String realEndDate;

        @Schema(description = "Coût des travaux en Ariary", example = "1500000.00")
        private BigDecimal price;

        @Schema(description = "Entreprise responsable")
        private CompanyDto company;
    }
}
