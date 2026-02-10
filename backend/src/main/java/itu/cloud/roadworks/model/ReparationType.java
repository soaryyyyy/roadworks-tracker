package itu.cloud.roadworks.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "reparation_type")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReparationType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer niveau;
}

