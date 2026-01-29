package itu.cloud.roadworks.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "status_signalement")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusSignalement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String libelle;
}
