package itu.cloud.roadworks.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "signalement")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Signalement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_account", nullable = false)
    private Account account;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descriptions;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false, length = 255)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String picture;

    @Column(precision = 12, scale = 2)
    private BigDecimal surface;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_type_problem", nullable = false)
    private TypeProblem typeProblem;
}
