package com.backend.persistence;

import com.backend.modele.Professeur;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfesseurRepository extends JpaRepository<Professeur, Long> {

    boolean existsByEmail(String email);
    Professeur findByEmail(String email);
}
