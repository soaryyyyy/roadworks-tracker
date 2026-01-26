package itu.cloud.roadworks.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class SignalementProblemDto {
    private Long id;
    private String typeProblem;
    private String illustrationProblem;
    private String location;
    private SignalementProblemDetail detail;

    @Data
    @Builder
    public static class SignalementProblemDetail {
        private String etat;
        private Instant dateProblem;
        private BigDecimal surfaceM2;
        private BigDecimal budget;
        private CompanyDto entrepriseAssign;
        private String description;
    }

    @Data
    @Builder
    public static class CompanyDto {
        private Long id;
        private String name;
    }
}
