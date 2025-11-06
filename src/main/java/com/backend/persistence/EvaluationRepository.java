package com.backend.persistence;

import com.backend.modele.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    List<Evaluation> findAllByEmployeurId(Long employeurId);
    boolean existsByEtudiantIdAndEmployeurId(Long id, Long id1);

    boolean existsByEntenteId(Long id);
}