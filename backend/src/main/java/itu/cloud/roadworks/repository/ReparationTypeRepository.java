package itu.cloud.roadworks.repository;

import itu.cloud.roadworks.model.ReparationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReparationTypeRepository extends JpaRepository<ReparationType, Long> {
}

