package itu.cloud.roadworks.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "signalement_status")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalementStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_signalement", nullable = false)
    private Signalement signalement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_status_signalement", nullable = false)
    private StatusSignalement statusSignalement;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
