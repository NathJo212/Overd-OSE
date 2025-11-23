package com.backend.persistence;

import com.backend.modele.Etudiant;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface EtudiantRepository extends CrudRepository<Etudiant, Long> {

    boolean existsByEmail(String email);
    Etudiant findByEmail(String email);
    List<Etudiant> findAllByStatutCV(Etudiant.StatutCV statutCV);
    List<Etudiant> findAllByProgEtude(com.backend.modele.Programme progEtude);

    Iterable<? extends Etudiant> findAllByAnnee(String annee);
    List<Etudiant> findAllByStatutCVAndAnnee(Etudiant.StatutCV statutCV, String annee);
}
