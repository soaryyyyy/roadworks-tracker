package itu.cloud.roadworks.repository;

import itu.cloud.roadworks.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Long> {
}
