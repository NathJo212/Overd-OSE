package com.backend.persistence;

import com.backend.modele.AnneeAcademique;
import com.backend.modele.EvaluationMilieuStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationMilieuStageParProfesseurRepository extends JpaRepository<EvaluationMilieuStage, Long> {
    List<EvaluationMilieuStage> findAllByProfesseurId(Long professeurId);
    boolean existsByEntenteId(Long ententeId);

    // Méthodes avec filtrage par année académique
    List<EvaluationMilieuStage> findAllByProfesseurIdAndAnneeAcademique(Long professeurId, AnneeAcademique anneeAcademique);
}
