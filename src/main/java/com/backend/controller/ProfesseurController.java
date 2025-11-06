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
    public ResponseEntity<byte[]> getCvEtudiant(@PathVariable Long etudiantId) {
        try {
            byte[] cvDechiffre = professeurService.getCvEtudiantPourProfesseur(etudiantId);

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"cv.pdf\"")
                    .header("Content-Type", "application/pdf")
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
    public ResponseEntity<byte[]> getLettrePresentation(@PathVariable Long candidatureId) {
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

    @PostMapping("/evaluation-milieu-stage")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> creerEvaluationMilieuStage(@RequestBody CreerEvaluationMilieuStageDTO dto) {
        try {
            professeurService.creerEvaluationMilieuStage(dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new MessageRetourDTO("Évaluation du milieu de stage créée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (EntenteNonTrouveException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (EvaluationDejaExistanteException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (EntenteNonFinaliseeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageRetourDTO(null, new ErrorResponse(ErrorCode.UNKNOWN_ERROR.getCode(), e.getMessage())));
        }
    }

    @GetMapping("/evaluations-milieu-stage")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<EvaluationMilieuStageDTO>> getEvaluationsMilieuStage() {
        try {
            List<EvaluationMilieuStageDTO> evaluations = professeurService.getEvaluationsMilieuStagePourProfesseur();
            return ResponseEntity.ok(evaluations);
        } catch (ActionNonAutoriseeException | UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/evaluations-milieu-stage/{id}")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<EvaluationMilieuStageDTO> getEvaluationMilieuStageSpecifique(@PathVariable Long id) {
        try {
            EvaluationMilieuStageDTO evaluation = professeurService.getEvaluationMilieuStageSpecifique(id);
            return ResponseEntity.ok(evaluation);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/evaluations-milieu-stage/{id}/pdf")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<byte[]> getEvaluationMilieuStagePdf(@PathVariable Long id) {
        try {
            byte[] pdf = professeurService.getEvaluationMilieuStagePdf(id);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"evaluation-milieu-stage.pdf\"")
                    .header("Content-Type", "application/pdf")
                    .body(pdf);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}