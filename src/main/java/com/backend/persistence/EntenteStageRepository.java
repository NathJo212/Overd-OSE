package com.backend.persistence;

import com.backend.modele.AnneeAcademique;
import com.backend.modele.Employeur;
import com.backend.modele.EntenteStage;
import com.backend.modele.Etudiant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EntenteStageRepository extends JpaRepository<EntenteStage, Long> {
    List<EntenteStage> findByArchivedFalse();
    boolean existsByEtudiantAndOffreAndArchivedFalse(com.backend.modele.Etudiant etudiant, com.backend.modele.Offre offre);
    List<EntenteStage> findByEtudiantAndEtudiantSignatureAndArchivedFalse(
            Etudiant etudiant,
            EntenteStage.SignatureStatus etudiantSignature
    );
    List<EntenteStage> findByEtudiantAndArchivedFalse(Etudiant etudiant);

    List<EntenteStage> findByEmployeurAndEmployeurSignatureAndArchivedFalse(Employeur employeur, EntenteStage.SignatureStatus signatureStatus);

    List<EntenteStage> findByEmployeurAndArchivedFalse(Employeur employeur);

    List<EntenteStage> findByEtudiantId(Long etudiantId);

    // Méthodes avec filtrage par année académique
    List<EntenteStage> findByEtudiantAndArchivedFalseAndAnneeAcademique(Etudiant etudiant, AnneeAcademique anneeAcademique);

    List<EntenteStage> findByEmployeurAndArchivedFalseAndAnneeAcademique(Employeur employeur, AnneeAcademique anneeAcademique);

    List<EntenteStage> findByArchivedFalseAndAnneeAcademique(AnneeAcademique anneeAcademique);

    List<EntenteStage> findByEtudiantAndEtudiantSignatureAndArchivedFalseAndAnneeAcademique(Etudiant etudiant, EntenteStage.SignatureStatus signatureStatus, AnneeAcademique anneeAcademique);

    List<EntenteStage> findByEmployeurAndEmployeurSignatureAndArchivedFalseAndAnneeAcademique(Employeur employeur, EntenteStage.SignatureStatus signatureStatus, AnneeAcademique anneeAcademique);
}
