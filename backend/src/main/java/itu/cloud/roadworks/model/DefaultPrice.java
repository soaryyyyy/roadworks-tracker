package itu.cloud.roadworks.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "default_price")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DefaultPrice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal price;
}

