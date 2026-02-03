package itu.cloud.roadworks.repository;

import itu.cloud.roadworks.model.AdvancementRate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdvancementRateRepository extends JpaRepository<AdvancementRate, Long> {
    Optional<AdvancementRate> findByStatusKeyIgnoreCase(String statusKey);
}
