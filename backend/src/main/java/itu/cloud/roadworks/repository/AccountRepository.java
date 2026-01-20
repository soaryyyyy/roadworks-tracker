package itu.cloud.roadworks.repository;

import itu.cloud.roadworks.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, Long> {
}
