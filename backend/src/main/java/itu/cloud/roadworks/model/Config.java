package itu.cloud.roadworks.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "config")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Config {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "max_attempts", nullable = false)
    private Integer maxAttempts;

    @Column(name = "session_duration", nullable = false)
    private Integer sessionDuration;
}
