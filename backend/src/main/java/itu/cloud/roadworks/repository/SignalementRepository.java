package itu.cloud.roadworks.repository;

import itu.cloud.roadworks.model.Signalement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SignalementRepository extends JpaRepository<Signalement, Long> {
    Optional<Signalement> findByFirebaseId(String firebaseId);
}
