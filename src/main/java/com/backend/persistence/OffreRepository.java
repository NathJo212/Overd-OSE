package com.backend.persistence;

import com.backend.modele.AnneeAcademique;
import com.backend.modele.Employeur;
import com.backend.modele.Offre;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface OffreRepository extends CrudRepository<Offre, Long> {
    List<Offre> findByStatutApprouve(Offre.StatutApprouve statutApprouve);

    List<Offre> findOffreByEmployeurId(Long employeurId);

    List<Offre> findAllByStatutApprouve(Offre.StatutApprouve statutApprouve);

    List<Offre> findAll();

    List<Offre> findAllByEmployeur(Employeur employeur);

    // Méthodes avec filtrage par année académique
    List<Offre> findByStatutApprouveAndAnneeAcademique(Offre.StatutApprouve statutApprouve, AnneeAcademique anneeAcademique);

    List<Offre> findAllByStatutApprouveAndAnneeAcademique(Offre.StatutApprouve statutApprouve, AnneeAcademique anneeAcademique);

    List<Offre> findAllByEmployeurAndAnneeAcademique(Employeur employeur, AnneeAcademique anneeAcademique);

    List<Offre> findAllByAnneeAcademique(AnneeAcademique anneeAcademique);

}
