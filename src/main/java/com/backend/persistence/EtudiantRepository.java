package com.backend.persistence;

import com.backend.modele.Etudiant;
import org.springframework.data.repository.CrudRepository;

public interface EtudiantRepository extends CrudRepository<Etudiant, Long> {

    boolean existsByEmail(String email);

}
