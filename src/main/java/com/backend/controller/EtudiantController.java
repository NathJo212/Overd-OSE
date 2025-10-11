package com.backend.controller;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.Exceptions.UtilisateurPasTrouveException;
import com.backend.service.DTO.*;
import com.backend.service.EtudiantService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/OSEetudiant")
public class EtudiantController {

    private final EtudiantService etudiantService;

    public EtudiantController(EtudiantService etudiantService) {
        this.etudiantService = etudiantService;
    }

    @PostMapping("/creerCompte")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> creerCompte(@RequestBody EtudiantDTO etudiantDTO) {
        try {
            etudiantService.creerEtudiant(etudiantDTO.getEmail(), etudiantDTO.getPassword(),
                    etudiantDTO.getTelephone(), etudiantDTO.getPrenom(), etudiantDTO.getNom(),
                    etudiantDTO.getProgEtude(), etudiantDTO.getSession(), etudiantDTO.getAnnee());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new MessageRetourDTO("Étudiant créé avec succès", null));
        } catch (EmailDejaUtiliseException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null,  new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (MotPasseInvalideException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageRetourDTO(null,  new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        }
    }

    @PostMapping("/cv")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> uploadCv(@RequestParam("cv") MultipartFile fichierCv) {
        try {
            etudiantService.sauvegarderCvEtudiantConnecte(fichierCv);
            return ResponseEntity.status(HttpStatus.OK)
                    .body(new MessageRetourDTO("CV sauvegardé avec succès", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageRetourDTO(null, new ErrorResponse("CV_001", "Erreur lors de l'upload du CV : " + e.getMessage())));
        }
    }

    @GetMapping("/cv")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<byte[]> getCvEtudiant() {
        try {
            CvDTO contenuCv = etudiantService.getCvEtudiantConnecte();

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"cv.pdf\"")
                    .header("Content-Type", "application/pdf")
                    .body(contenuCv.getCv());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .header("Content-Type", "application/json")
                    .body(null);
        }
    }

    @GetMapping("/cv/info")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<StatutCvDTO> getInfosCvEtudiant() throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        StatutCvDTO dto = etudiantService.getInfosCvEtudiantConnecte();
        return ResponseEntity.ok(dto);
    }

    @GetMapping("voirOffres")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<OffreDTO>> voirOffres() {
        try {
            List<OffreDTO> offres = etudiantService.getOffresApprouves();
            return ResponseEntity.ok(offres);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/candidatures")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> postulerOffre(@RequestBody Map<String, Object> request) {
        try {
            Long offreId = Long.valueOf(request.get("offreId").toString());
            String lettreMotivation = request.get("lettreMotivation") != null
                    ? request.get("lettreMotivation").toString()
                    : null;

            CandidatureDTO candidature = etudiantService.postulerOffre(offreId, lettreMotivation);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new MessageRetourDTO("Candidature soumise avec succès", null));
        } catch (ActionNonAutoriseeException | UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse("CAND_001", e.getMessage())));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageRetourDTO(null, new ErrorResponse("CAND_002", e.getMessage())));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageRetourDTO(null, new ErrorResponse("CAND_003", "Erreur lors de la candidature")));
        }
    }

    @GetMapping("/candidatures")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<CandidatureDTO>> getMesCandidatures() {
        try {
            List<CandidatureDTO> candidatures = etudiantService.getMesCandidatures();
            return ResponseEntity.ok(candidatures);
        } catch (ActionNonAutoriseeException | UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/candidatures/{id}/retirer")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> retirerCandidature(@PathVariable Long id) {
        try {
            etudiantService.retirerCandidature(id);
            return ResponseEntity.ok()
                    .body(new MessageRetourDTO("Candidature retirée avec succès", null));
        } catch (ActionNonAutoriseeException | UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse("CAND_004", e.getMessage())));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageRetourDTO(null, new ErrorResponse("CAND_005", e.getMessage())));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageRetourDTO(null, new ErrorResponse("CAND_006", "Erreur lors du retrait de la candidature")));
        }
    }

    @GetMapping("/offres/{id}/a-postule")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<Map<String, Boolean>> aPostuleOffre(@PathVariable Long id) {
        try {
            boolean aPostule = etudiantService.aPostuleOffre(id);
            return ResponseEntity.ok(Map.of("aPostule", aPostule));
        } catch (ActionNonAutoriseeException | UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


}
