package itu.cloud.roadworks.repository;

import itu.cloud.roadworks.model.StatusSignalement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StatusSignalementRepository extends JpaRepository<StatusSignalement, Long> {
}
