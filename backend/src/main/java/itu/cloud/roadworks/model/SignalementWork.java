package itu.cloud.roadworks.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "signalement_work")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalementWork {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_signalement", nullable = false)
    private Signalement signalement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_company", nullable = false)
    private Company company;

    private LocalDate startDate;

    private LocalDate endDateEstimation;

    @Column(precision = 14, scale = 2)
    private BigDecimal price;

    private LocalDate realEndDate;
}
