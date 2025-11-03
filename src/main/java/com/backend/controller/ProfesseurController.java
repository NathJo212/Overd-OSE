package com.backend.controller;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.CVNonExistantException;
import com.backend.Exceptions.UtilisateurPasTrouveException;
import com.backend.service.DTO.EtudiantDTO;
import com.backend.service.DTO.ProfesseurDTO;
import com.backend.service.ProfesseurService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

    @GetMapping("/etudiants")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<EtudiantDTO>> getMesEtudiants() {
        try {
            ProfesseurDTO professeurConnecte = ProfesseurDTO.toDTO(professeurService.getProfesseurConnecte());
            List<EtudiantDTO> etudiants = professeurService.getMesEtudiants(professeurConnecte.getId());
            return ResponseEntity.ok(etudiants);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/etudiants/{etudiantId}/cv")
    public ResponseEntity<byte[]> telechargerCvEtudiant(@PathVariable Long etudiantId)
            throws CVNonExistantException, UtilisateurPasTrouveException {

        byte[] cvDechiffre = professeurService.getCvEtudiantPourProfesseur(etudiantId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=CV_" + etudiantId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(cvDechiffre.length)
                .body(cvDechiffre);
    }



}