package itu.cloud.roadworks.repository;

import itu.cloud.roadworks.model.StatusSignalement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StatusSignalementRepository extends JpaRepository<StatusSignalement, Long> {
    Optional<StatusSignalement> findByLibelle(String libelle);
}
