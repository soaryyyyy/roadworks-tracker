package itu.cloud.roadworks.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class WorkStatsDto {

    @Data
    @Builder
    public static class Stat {
        private Long companyId; // null for global
        private String companyName;
        private Double avgLeadDays;
        private Double avgInProgressDays;
        private Double avgTotalDays;
        private Long count;
    }

    private Stat overall;
    private List<Stat> byCompany;
}
