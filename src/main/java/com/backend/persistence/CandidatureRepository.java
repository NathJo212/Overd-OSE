package com.backend.persistence;

import com.backend.modele.Candidature;
import com.backend.modele.Etudiant;
import com.backend.modele.Offre;
import com.backend.service.DTO.CandidatureDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatureRepository extends JpaRepository<Candidature, Long> {

    List<Candidature> findAllByEtudiant(Etudiant etudiant);

    boolean existsByEtudiantAndOffre(Etudiant etudiant, Offre offre);

    Optional<Candidature> findByEtudiantAndOffre(Etudiant etudiant, Offre offre);

    List<Candidature> findAllByOffreIn(List<Offre> offres);

    List<Candidature> findByStatut(Candidature.StatutCandidature statutCandidature);

    List<Candidature> findByEtudiantId(Long etudiantId);
}