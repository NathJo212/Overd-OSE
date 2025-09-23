package com.backend.service;


import com.backend.modele.Offre;
import com.backend.persistence.GestionnaireRepository;
import com.backend.persistence.OffreRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class GestionnaireService {

    private final OffreRepository offreRepository;

    public GestionnaireService(OffreRepository offreRepository) {
        this.offreRepository = offreRepository;
    }

    @Transactional
    public void approuveOffre(Offre offre) {
        offre.setApprouve(true);
        offreRepository.save(offre);
    }

    @Transactional
    public void refuseOffre(Offre offre) {
        offre.setApprouve(false);
        offreRepository.save(offre);
    }


}
