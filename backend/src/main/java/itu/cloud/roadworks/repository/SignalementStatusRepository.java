package itu.cloud.roadworks.repository;

import itu.cloud.roadworks.model.SignalementStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SignalementStatusRepository extends JpaRepository<SignalementStatus, Long> {
}
