package itu.cloud.roadworks.repository;

import itu.cloud.roadworks.model.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountStatusRepository extends JpaRepository<AccountStatus, Long> {
}
