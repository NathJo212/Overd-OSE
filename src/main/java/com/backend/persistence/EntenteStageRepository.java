package com.backend.persistence;

import com.backend.modele.EntenteStage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EntenteStageRepository extends JpaRepository<EntenteStage, Long> {
    List<EntenteStage> findByArchivedFalse();
    boolean existsByEtudiantAndOffreAndArchivedFalse(com.backend.modele.Etudiant etudiant, com.backend.modele.Offre offre);
}
