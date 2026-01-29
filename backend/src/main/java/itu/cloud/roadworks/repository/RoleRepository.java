package itu.cloud.roadworks.repository;

import itu.cloud.roadworks.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByLibelle(String libelle);
}
