package itu.cloud.roadworks.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalementPhotoDto {
    private Long id;
    private Long signalementId;
    private String photoData;
    private Integer photoOrder;
    private Instant createdAt;
}
