package com.backend.controller;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.CandidatureNonTrouveeException;
import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.service.DTO.*;
import com.backend.service.EmployeurService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        } catch (EmailDejaUtiliseException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null,  new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (MotPasseInvalideException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageRetourDTO(null,  new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        }
    }

    @PostMapping("/creerOffre")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> creerOffre(@RequestBody OffreDTO offreDTO) {
        try{
            employeurService.creerOffreDeStage(offreDTO.getAuthResponseDTO(), offreDTO.getTitre(),
                    offreDTO.getDescription(), offreDTO.getDate_debut(), offreDTO.getDate_fin(),
                    offreDTO.getProgEtude(), offreDTO.getLieuStage(), offreDTO.getRemuneration(),
                    offreDTO.getDateLimite());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new MessageRetourDTO("Offre de stage créée avec succès", null));
        } catch (ActionNonAutoriseeException e){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null,  new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        }
    }

    @PostMapping("/OffresParEmployeur")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<OffreDTO>> getAllOffresParEmployeur(@RequestBody AuthResponseDTO utilisateur) {
        try {
            List<OffreDTO> offres = employeurService.OffrePourEmployeur(utilisateur);
            return ResponseEntity.ok(offres);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @GetMapping("/candidatures")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<CandidatureDTO>> getAllCandidatures() {
        try {
            List<CandidatureDTO> candidatures = employeurService.getCandidaturesPourEmployeur();
            return ResponseEntity.ok(candidatures);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/candidatures/{id}")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<CandidatureDTO> getCandidatureSpecifique(@PathVariable Long id) {
        try {
            CandidatureDTO candidature = employeurService.getCandidatureSpecifique(id);
            return ResponseEntity.ok(candidature);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (CandidatureNonTrouveeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/candidatures/{id}/cv")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<byte[]> getCvCandidature(@PathVariable Long id) {
        try {
            byte[] cv = employeurService.getCvPourCandidature(id);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"cv.pdf\"")
                    .header("Content-Type", "application/pdf")
                    .body(cv);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (CandidatureNonTrouveeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/candidatures/{id}/lettre-motivation")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<byte[]> getLettreMotivationCandidature(@PathVariable Long id) {
        try {
            byte[] lettreMotivation = employeurService.getLettreMotivationPourCandidature(id);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"lettre-motivation.pdf\"")
                    .header("Content-Type", "application/pdf")
                    .body(lettreMotivation);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (CandidatureNonTrouveeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}