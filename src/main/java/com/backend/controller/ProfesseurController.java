package com.backend.controller;


import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.UtilisateurPasTrouveException;
import com.backend.modele.Professeur;
import com.backend.service.DTO.ErrorResponse;
import com.backend.service.DTO.EtudiantDTO;
import com.backend.service.DTO.MessageRetourDTO;
import com.backend.service.ProfesseurService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/OSEProfesseur")
public class ProfesseurController {

    private final ProfesseurService professeurService;

    public ProfesseurController(ProfesseurService professeurService) {
        this.professeurService = professeurService;
    }


    @GetMapping("/{id}/etudiants")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<EtudiantDTO>> getMesEtudiants(@PathVariable("id") Long professeurId) {
        try {
            List<EtudiantDTO> etudiants = professeurService.getMesEtudiants(professeurId);
            return ResponseEntity.ok(etudiants);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }




}
