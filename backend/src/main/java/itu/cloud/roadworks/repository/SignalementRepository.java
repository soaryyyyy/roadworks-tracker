package itu.cloud.roadworks.repository;

import itu.cloud.roadworks.model.Signalement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SignalementRepository extends JpaRepository<Signalement, Long> {
}
