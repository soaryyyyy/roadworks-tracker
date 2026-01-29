package itu.cloud.roadworks.repository;

import itu.cloud.roadworks.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByUsername(String username);
    boolean existsByUsername(String username);

    @Query("SELECT a FROM Account a JOIN FETCH a.role")
    List<Account> findAllWithRole();
}
