package itu.cloud.roadworks.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "advancement_rate", uniqueConstraints = {
        @UniqueConstraint(name = "uk_advancement_rate_status", columnNames = "status_key")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvancementRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Clé de statut (ex: nouveau, en_cours, terminé, new, in_progress, completed)
     */
    @Column(name = "status_key", nullable = false, length = 50)
    private String statusKey;

    /**
     * Pourcentage associé à ce statut (0-100)
     */
    @Column(nullable = false)
    private Integer percentage;
}
