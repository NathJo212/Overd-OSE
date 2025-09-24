package com.backend.persistence;

import com.backend.modele.Offre;
import org.springframework.data.repository.CrudRepository;

public interface OffreRepository extends CrudRepository<Offre, Long> {
}
