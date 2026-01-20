package itu.cloud.roadworks.dto;

import itu.cloud.roadworks.model.Signalement;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class SignalementDto {
    private Long id;
    private String location;
    private String descriptions;
    private Instant createdAt;
    private String typeProblem;

    public static SignalementDto fromEntity(Signalement signalement) {
        return SignalementDto.builder()
                .id(signalement.getId())
                .location(signalement.getLocation())
                .descriptions(signalement.getDescriptions())
                .createdAt(signalement.getCreatedAt())
                .typeProblem(signalement.getTypeProblem().getLibelle())
                .build();
    }
}
