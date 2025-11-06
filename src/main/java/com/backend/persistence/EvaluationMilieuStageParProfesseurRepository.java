package com.backend.persistence;

import com.backend.modele.EvaluationMilieuStageParProfesseur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationMilieuStageParProfesseurRepository extends JpaRepository<EvaluationMilieuStageParProfesseur, Long> {
    List<EvaluationMilieuStageParProfesseur> findAllByProfesseurId(Long professeurId);
    boolean existsByEntenteId(Long ententeId);
}
