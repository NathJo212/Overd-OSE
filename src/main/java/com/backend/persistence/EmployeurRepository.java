package com.backend.persistence;

import com.backend.modele.Employeur;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;

public interface EmployeurRepository extends CrudRepository<Employeur, Long> {

    boolean existsByEmail(String email);
    Optional findByEmail(String email);

}
