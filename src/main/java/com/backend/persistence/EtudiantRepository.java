package com.backend.persistence;

import com.backend.modele.Employeur;
import com.backend.modele.Etudiant;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface EtudiantRepository extends CrudRepository<Etudiant, Long> {

    boolean existsByEmail(String email);
    Etudiant findByEmail(String email);
    List<Etudiant> findByStatutCV(Etudiant.StatutCV statutCV);
}
