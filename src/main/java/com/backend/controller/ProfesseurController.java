package com.backend.controller;

import com.backend.Exceptions.*;
import com.backend.service.DTO.*;
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
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<byte[]> telechargerCvEtudiant(@PathVariable Long etudiantId) {
        try {
            byte[] cvDechiffre = professeurService.getCvEtudiantPourProfesseur(etudiantId);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=CV_" + etudiantId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(cvDechiffre.length)
                    .body(cvDechiffre);
        } catch (CVNonExistantException | UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/etudiants/{etudiantId}/ententes")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<EntenteStageDTO>> getEntentesPourEtudiant(@PathVariable Long etudiantId) {
        try {
            List<EntenteStageDTO> ententes = professeurService.getEntentesPourEtudiant(etudiantId);
            return ResponseEntity.ok(ententes);
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/etudiants/{etudiantId}/candidatures")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<CandidatureDTO>> getCandidaturesPourEtudiant(@PathVariable Long etudiantId) {
        try {
            List<CandidatureDTO> candidatures = professeurService.getCandidaturesPourEtudiant(etudiantId);
            return ResponseEntity.ok(candidatures);
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/candidatures/{candidatureId}/lettre")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<byte[]> telechargerLettrePresentation(@PathVariable Long candidatureId) {
        try {
            byte[] lettreDechiffree = professeurService.getLettrePresentationParCandidature(candidatureId);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=LettrePresentation_" + candidatureId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(lettreDechiffree.length)
                    .body(lettreDechiffree);
        } catch (UtilisateurPasTrouveException | LettreDeMotivationNonDisponibleException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/ententes/{ententeId}/statut")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<StatutStageDTO> getStatutStage(@PathVariable Long ententeId) {
        try {
            StatutStageDTO statut = professeurService.getStatutStage(ententeId);
            return ResponseEntity.ok(statut);
        } catch (EntenteNonTrouveeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}