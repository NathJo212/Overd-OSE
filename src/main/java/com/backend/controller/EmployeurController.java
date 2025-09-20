package com.backend.controller;

import com.backend.Exceptions.EmailDejaUtilise;
import com.backend.Exceptions.InvalidMotPasseException;
import com.backend.service.DTO.EmployeurDTO;
import com.backend.service.DTO.LoginDTO;
import com.backend.service.DTO.MessageRetourDTO;
import com.backend.service.DTO.OffreDTO;
import com.backend.service.EmployeurService;
import com.backend.config.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/OSEemployeur")
public class EmployeurController {

    private final EmployeurService employeurService;

    public EmployeurController(EmployeurService employeurService) {
        this.employeurService = employeurService;
    }

    @PostMapping("/creerCompte")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> creerCompte(@RequestBody EmployeurDTO employeurDTO) {
        try {
            employeurService.creerEmployeur(employeurDTO.getEmail(), employeurDTO.getPassword(),
                    employeurDTO.getTelephone(), employeurDTO.getNomEntreprise(),
                    employeurDTO.getContact());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new MessageRetourDTO("Employeur créé avec succès", null));
        }catch (EmailDejaUtilise | InvalidMotPasseException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null, e.getMessage()));
        }
    }

    @PostMapping("/creerOffre")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> creerOffre(@RequestBody OffreDTO offreDTO) {
        try{
            employeurService.creerOffreDeStage(offreDTO.getDescription(), offreDTO.getDescription(), offreDTO.getDate_debut(), offreDTO.getDate_fin(), offreDTO.getProgEtude(), offreDTO.getLieuStage(), offreDTO.getRemuneration(), offreDTO.getDateLimite());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new MessageRetourDTO("Offre de stage créée avec succès", null));
        }catch (Exception  e){
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null, e.getMessage()));
        }
    }
}