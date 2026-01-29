package itu.cloud.roadworks.repository;

import itu.cloud.roadworks.model.Config;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfigRepository extends JpaRepository<Config, Long> {
}
