package itu.cloud.roadworks.repository;

import itu.cloud.roadworks.model.DefaultPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DefaultPriceRepository extends JpaRepository<DefaultPrice, Long> {
}

