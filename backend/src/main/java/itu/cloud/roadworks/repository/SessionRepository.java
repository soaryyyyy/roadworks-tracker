package itu.cloud.roadworks.repository;

import itu.cloud.roadworks.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SessionRepository extends JpaRepository<Session, UUID> {
}
