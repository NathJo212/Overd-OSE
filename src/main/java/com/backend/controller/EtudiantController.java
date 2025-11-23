package com.backend.controller;

import com.backend.Exceptions.*;
import com.backend.service.DTO.*;
import com.backend.service.EtudiantService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
                    etudiantDTO.getProgEtude());
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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageRetourDTO(null, new ErrorResponse("CV_001", e.getMessage())));
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
    public ResponseEntity<MessageRetourDTO> postulerOffre(
            @RequestParam("offreId") Long offreId,
            @RequestParam(value = "lettreMotivation", required = false) MultipartFile lettreMotivationFichier) {
        try {
            etudiantService.postulerOffre(offreId, lettreMotivationFichier);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new MessageRetourDTO("Candidature soumise avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse("AUTHORIZATION_001", e.getMessage())));
        } catch (OffreNonExistantException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse("OFFER_001", e.getMessage())));
        } catch (CvNonApprouveException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageRetourDTO(null, new ErrorResponse("CV_003", e.getMessage())));
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse("AUTH_003", e.getMessage())));
        } catch (LettreDeMotivationNonDisponibleException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageRetourDTO(null, new ErrorResponse("CAND_002", e.getMessage())));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageRetourDTO(null, new ErrorResponse("ERROR_000", e.getMessage())));
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

    @GetMapping("/candidatures/{id}/cv")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<byte[]> getCvCandidature(@PathVariable Long id) {
        try {
            byte[] cv = etudiantService.getCvPourCandidature(id);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"cv.pdf\"")
                    .header("Content-Type", "application/pdf")
                    .body(cv);
        } catch (ActionNonAutoriseeException | UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (CandidatureNonDisponibleException | CVNonExistantException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/candidatures/{id}/lettre-motivation")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<byte[]> getLettreMotivationCandidature(@PathVariable Long id) {
        try {
            byte[] lettreMotivation = etudiantService.getLettreMotivationPourCandidature(id);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"lettre-motivation.pdf\"")
                    .header("Content-Type", "application/pdf")
                    .body(lettreMotivation);
        } catch (ActionNonAutoriseeException | UtilisateurPasTrouveException | CandidatureNonDisponibleException |
                 LettreDeMotivationNonDisponibleException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PutMapping("/candidatures/{id}/retirer")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> retirerCandidature(@PathVariable Long id) {
        try {
            etudiantService.retirerCandidature(id);
            return ResponseEntity.ok()
                    .body(new MessageRetourDTO("Candidature retirée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse("AUTHORIZATION_001", e.getMessage())));
        } catch (CandidatureNonDisponibleException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse("CAND_001", e.getMessage())));
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse("AUTH_003", e.getMessage())));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageRetourDTO(null, new ErrorResponse("ERROR_000", e.getMessage())));
        }
    }

    @GetMapping("/offres/{id}/a-postule")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<Map<String, Boolean>> aPostuleOffre(@PathVariable Long id) {
        try {
            boolean aPostule = etudiantService.aPostuleOffre(id);
            return ResponseEntity.ok(Map.of("aPostule", aPostule));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (OffreNonExistantException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @GetMapping("/candidatures/{id}/convocation")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<ConvocationEntrevueDTO> getConvocationPourCandidature(@PathVariable Long id) {
        try {
            ConvocationEntrevueDTO convocation = etudiantService.getConvocationPourCandidature(id);
            return ResponseEntity.ok(convocation);
        } catch (ActionNonAutoriseeException | UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (ConvocationNonTrouveeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/notifications")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<NotificationDTO>> getNotifications() {
        try {
            List<NotificationDTO> dtos = etudiantService.getNotificationsPourEtudiantConnecte();
            return ResponseEntity.ok(dtos);
        } catch (ActionNonAutoriseeException | UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/notifications/{id}/lu")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> marquerNotificationLu(
            @PathVariable("id") Long id,
            @RequestBody boolean lu) {
        try {
            etudiantService.marquerNotificationLu(id, lu);
            return ResponseEntity.ok()
                    .body(new MessageRetourDTO("Notification marquée comme lue", null));
        }catch (NotificationPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageRetourDTO(null, new ErrorResponse(ErrorCode.UNKNOWN_ERROR.getCode(), e.getMessage())));
        }
    }

    @PutMapping("/candidatures/{id}/accepter")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> accepterOffreApprouvee(@PathVariable Long id) {
        try {
            etudiantService.accepterOffreApprouvee(id);
            return ResponseEntity.ok()
                    .body(new MessageRetourDTO("Offre acceptée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (CandidatureNonDisponibleException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(ErrorCode.CANDIDATURE_NON_DISPONIBLE.getCode(), e.getMessage())));
        } catch (StatutCandidatureInvalideException e) {
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

    @PutMapping("/candidatures/{id}/refuser")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> refuserOffreApprouvee(@PathVariable Long id) {
        try {
            etudiantService.refuserOffreApprouvee(id);
            return ResponseEntity.ok()
                    .body(new MessageRetourDTO("Offre refusée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (CandidatureNonDisponibleException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(ErrorCode.CANDIDATURE_NON_DISPONIBLE.getCode(), e.getMessage())));
        } catch (StatutCandidatureInvalideException e) {
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

    @PutMapping("/ententes/{id}/signer")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> signerEntente(@PathVariable Long id) {
        try {
            etudiantService.signerEntente(id);
            return ResponseEntity.ok()
                    .body(new MessageRetourDTO("Entente signée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (EntenteNonTrouveeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(ErrorCode.ENTENTE_NON_TROUVE.getCode(), e.getMessage())));
        } catch (StatutEntenteInvalideException e) {
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

    @PutMapping("/ententes/{id}/refuser")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> refuserEntente(@PathVariable Long id) {
        try {
            etudiantService.refuserEntente(id);
            return ResponseEntity.ok()
                    .body(new MessageRetourDTO("Entente refusée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (EntenteNonTrouveeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(ErrorCode.ENTENTE_NON_TROUVE.getCode(), e.getMessage())));
        } catch (StatutEntenteInvalideException e) {
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


// get all ententes in waiting for the connected student
    @GetMapping("/ententes/en-attente")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<EntenteStageDTO>> getEntentesEnAttente() {
        try {
            List<EntenteStageDTO> ententes = etudiantService.getEntentesEnAttente();
            return ResponseEntity.ok(ententes);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(null);
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    // get all ententes for the connected student
    @GetMapping("/ententes")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<EntenteStageDTO>> getMesEntentes() {
        try {
            List<EntenteStageDTO> ententes = etudiantService.getMesEntentes();
            return ResponseEntity.ok(ententes);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(null);
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @GetMapping("/ententes/{id}/document")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<Resource> getEntenteDocument(@PathVariable Long id) {
        try {
            byte[] pdf = etudiantService.getEntenteDocument(id);
            ByteArrayResource resource = new ByteArrayResource(pdf);
            String filename = String.format("entente_%d.pdf", id);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
//


}