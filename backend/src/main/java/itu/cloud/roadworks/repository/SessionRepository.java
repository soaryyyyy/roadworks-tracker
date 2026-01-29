package itu.cloud.roadworks.repository;

import itu.cloud.roadworks.model.Account;
import itu.cloud.roadworks.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {
    Optional<Session> findByToken(String token);
    Optional<Session> findByTokenAndExpiresAtAfter(String token, Instant now);
    void deleteByAccount(Account account);
    void deleteByExpiresAtBefore(Instant now);
}
