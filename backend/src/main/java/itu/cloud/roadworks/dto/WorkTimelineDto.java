package itu.cloud.roadworks.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
public class WorkTimelineDto {
    private Long id;
    private String companyName;
    private String typeProblem;
    private Instant createdAt;
    private LocalDate startDate;
    private LocalDate inProgressDate;
    private LocalDate endDate;
}
