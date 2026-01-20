package itu.cloud.roadworks.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "type_problem")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TypeProblem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String icone;

    @Column(nullable = false, length = 100)
    private String libelle;
}
