package com.backend.controller;

import com.backend.persistence.OffreRepository;
import com.backend.service.DTO.EmployeurDTO;
import com.backend.service.DTO.MessageRetourDTO;
import com.backend.service.DTO.OffreDTO;
import com.backend.service.GestionnaireService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/OSEGestionnaire")
public class GestionnaireControlleur {

    private final GestionnaireService gestionnaireService;
    private final OffreRepository offreRepository;

    public GestionnaireControlleur(GestionnaireService gestionnaireService, OffreRepository offreRepository) {
        this.gestionnaireService = gestionnaireService;
        this.offreRepository = offreRepository;
    }

    @PostMapping("/approuveOffre")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> approuveOffre(@RequestBody OffreDTO offreDTO) {
        Long id = offreDTO.getId();
        if (id == null) {
            return ResponseEntity.badRequest().body(new MessageRetourDTO("ID de l'offre manquant", null));
        }

        return offreRepository.findById(id)
                .map(offre -> {
                    gestionnaireService.approuveOffre(offre);
                    return ResponseEntity.ok(new MessageRetourDTO("Offre approuvée avec succès", null));
                })
                .orElse(ResponseEntity.badRequest().body(new MessageRetourDTO("Offre introuvable", null)));
    }

    @PostMapping("/refuseOffre")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> refuseOffre(@RequestBody OffreDTO offreDTO) {
        Long id = offreDTO.getId();
        if (id == null) {
            return ResponseEntity.badRequest().body(new MessageRetourDTO("ID de l'offre manquant", null));
        }

        return offreRepository.findById(id)
                .map(offre -> {
                    gestionnaireService.refuseOffre(offre);
                    return ResponseEntity.ok(new MessageRetourDTO("Offre refusée avec succès", null));
                })
                .orElse(ResponseEntity.badRequest().body(new MessageRetourDTO("Offre introuvable", null)));
    }

    @GetMapping("/offresEnAttente")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<OffreDTO>> offreEnAttente() {
        try {
            List<OffreDTO> offresEnAttente = gestionnaireService.getOffresAttente();
            return ResponseEntity.ok(offresEnAttente);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
