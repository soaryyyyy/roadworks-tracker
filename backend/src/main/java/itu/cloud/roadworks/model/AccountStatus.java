package itu.cloud.roadworks.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "account_status")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_account", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_status_account", nullable = false)
    private StatusAccount statusAccount;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
