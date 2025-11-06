package com.backend.persistence;

import com.backend.modele.EvaluationEtudiantParEmployeur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationEtudiantParEmployeurRepository extends JpaRepository<EvaluationEtudiantParEmployeur, Long> {
    List<EvaluationEtudiantParEmployeur> findAllByEmployeurId(Long employeurId);

    boolean existsByEntenteId(Long id);
}