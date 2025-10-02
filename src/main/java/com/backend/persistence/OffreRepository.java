package com.backend.persistence;

import com.backend.modele.Offre;
import com.backend.service.DTO.OffreDTO;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface OffreRepository extends CrudRepository<Offre, Long> {
    List<Offre> findByStatutApprouve(Offre.StatutApprouve statutApprouve);

    List<Offre> findOffreByEmployeurId(Long employeurId);

    List<Offre> findAllByStatutApprouve(Offre.StatutApprouve statutApprouve);

}
