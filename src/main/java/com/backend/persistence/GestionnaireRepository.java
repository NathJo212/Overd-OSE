package com.backend.persistence;

import com.backend.modele.GestionnaireStage;
import org.springframework.data.repository.CrudRepository;

public interface GestionnaireRepository extends CrudRepository<GestionnaireStage, Long> {


}
