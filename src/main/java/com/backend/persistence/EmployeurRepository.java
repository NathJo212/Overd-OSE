package com.backend.persistence;

import com.backend.modele.Employeur;
import org.springframework.data.repository.CrudRepository;

public interface EmployeurRepository extends CrudRepository<Employeur, Long> {

    boolean existsByEmail(String email);

}
