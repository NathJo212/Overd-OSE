package com.backend.service;


import com.backend.modele.Offre;
import com.backend.persistence.GestionnaireRepository;
import com.backend.persistence.OffreRepository;
import com.backend.service.DTO.OffreDTO;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GestionnaireService {

    private final OffreRepository offreRepository;

    public GestionnaireService(OffreRepository offreRepository) {
        this.offreRepository = offreRepository;
    }

    @Transactional
    public void approuveOffre(Offre offre) {
        offre.setStatutApprouve(Offre.StatutApprouve.APPROUVE);
        offreRepository.save(offre);
    }

    @Transactional
    public void refuseOffre(Offre offre) {
        offre.setStatutApprouve(Offre.StatutApprouve.REFUSE);
        offreRepository.save(offre);
    }

    @Transactional
    public List<OffreDTO> getOffresAttente() {
        List<Offre> offresEnAttente = offreRepository.findByStatutApprouve(Offre.StatutApprouve.ATTENTE);

        return offresEnAttente.stream()
                .map(offre -> new OffreDTO().toDTO(offre))
                .collect(Collectors.toList());
    }

}
