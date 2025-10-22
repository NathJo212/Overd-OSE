package com.backend.controller;

import com.backend.Exceptions.*;
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
        } catch (DateInvalideException e) {
            // Date invalid (e.g. end before start) -> return validation-style error
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
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

    @PostMapping("/creerConvocation")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> creerConvocation(@RequestBody ConvocationEntrevueDTO dto){
        try {
            employeurService.creerConvocation(dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new MessageRetourDTO("Convocation créée avec succès", null));
        } catch (CandidatureNonTrouveeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse("CANDIDATURE_NOT_FOUND", "Candidature non trouvée avec l'ID: " + dto.candidatureId)));
        } catch (ConvocationDejaExistanteException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null, new ErrorResponse("CONVOCATION_EXISTS", e.getMessage())));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse("UNAUTHORIZED", "Vous n'êtes pas autorisé à créer une convocation pour cette candidature")));
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse("USER_NOT_FOUND", e.getMessage())));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageRetourDTO(null, new ErrorResponse("INTERNAL_ERROR", e.getMessage())));
        }
    }

    @PutMapping("/candidatures/convocation")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> modifierConvocation(@RequestBody ConvocationEntrevueDTO dto){
        try{
            employeurService.modifierConvocation(dto);
            return ResponseEntity.status(HttpStatus.OK)
                    .body(new MessageRetourDTO("Convocation modifiée avec succès", null));
        } catch (CandidatureNonTrouveeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse("CANDIDATURE_NOT_FOUND", e.getMessage())));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse("UNAUTHORIZED", "Vous n'êtes pas autorisé à modifier cette convocation")));
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse("USER_NOT_FOUND", e.getMessage())));
        }
    }

    @PutMapping("/candidatures/{id}/convocation/annuler")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> annulerConvocation(@PathVariable Long id){
        try{
            employeurService.annulerConvocation(id);
            return ResponseEntity.status(HttpStatus.OK)
                    .body(new MessageRetourDTO("Convocation annulée avec succès", null));
        } catch (CandidatureNonTrouveeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse("CANDIDATURE_NOT_FOUND", e.getMessage())));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse("UNAUTHORIZED", "Vous n'êtes pas autorisé à annuler cette convocation")));
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse("USER_NOT_FOUND", e.getMessage())));
        }
    }

    @GetMapping("/convocations")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<ConvocationEntrevueDTO>> getConvocationsPourEmployeur() {
        try {
            List<ConvocationEntrevueDTO> convocations = employeurService.getConvocationsPourEmployeur();
            return ResponseEntity.ok(convocations);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping ("/candidatures/{id}/approuver")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> approuverCandidature(@PathVariable Long id) {
        try {
            employeurService.approuverCandidature(id);
            return ResponseEntity.ok(new MessageRetourDTO("Candidature approuvée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (UtilisateurPasTrouveException  e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (CandidatureNonTrouveeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (CandidatureDejaVerifieException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageRetourDTO(null, new ErrorResponse(ErrorCode.UNKNOWN_ERROR.getCode(), e.getMessage())));
        }
    }

    @PostMapping("/candidatures/{id}/refuser")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> refuserCandidature(@PathVariable Long id, @RequestBody RaisonDTO raison) {
        try {
            employeurService.refuserCandidature(id, raison.getRaison());
            return ResponseEntity.ok(new MessageRetourDTO("Candidature refusée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (UtilisateurPasTrouveException  e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (CandidatureNonTrouveeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (CandidatureDejaVerifieException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageRetourDTO(null, new ErrorResponse(ErrorCode.UNKNOWN_ERROR.getCode(), e.getMessage())));
        }
    }

    @GetMapping("/notifications")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<NotificationDTO>> getNotifications() {
        try {
            List<NotificationDTO> dtos = employeurService.getNotificationsPourEmployeurConnecte();
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
            employeurService.marquerNotificationLu(id, lu);
            return ResponseEntity.ok()
                    .body(new MessageRetourDTO("Notification marquée comme lue", null));
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

    @GetMapping("/offres-approuvees")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<OffreDTO>> getOffresApprouvees() {
        try {
            List<OffreDTO> offres = employeurService.getOffresApprouvees();
            return ResponseEntity.ok(offres);
        } catch (ActionNonAutoriseeException | UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/ententes")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<EntenteStageDTO>> getEntentes() {
        try {
            List<EntenteStageDTO> ententes = employeurService.getEntentesPourEmployeur();
            return ResponseEntity.ok(ententes);
        } catch (ActionNonAutoriseeException | UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/ententes/en-attente")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<EntenteStageDTO>> getEntentesEnAttente() {
        try {
            List<EntenteStageDTO> ententes = employeurService.getEntentesEnAttente();
            return ResponseEntity.ok(ententes);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/ententes/{id}")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<EntenteStageDTO> getEntenteSpecifique(@PathVariable Long id) {
        try {
            EntenteStageDTO entente = employeurService.getEntenteSpecifique(id);
            return ResponseEntity.ok(entente);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/ententes/{id}/signer")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> signerEntente(@PathVariable Long id) {
        try {
            employeurService.signerEntente(id);
            return ResponseEntity.ok()
                    .body(new MessageRetourDTO("Entente signée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (EntenteNonTrouveException e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
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
            employeurService.refuserEntente(id);
            return ResponseEntity.ok()
                    .body(new MessageRetourDTO("Entente refusée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (EntenteNonTrouveException e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageRetourDTO(null, new ErrorResponse(ErrorCode.UNKNOWN_ERROR.getCode(), e.getMessage())));
        }
    }

    @PutMapping("/ententes/{id}/modification")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> modifierEntente(@PathVariable Long id, @RequestBody ModificationEntenteDTO dto) {
        try {
            employeurService.modifierEntente(id, dto);
            return ResponseEntity.ok()
                    .body(new MessageRetourDTO("Demande de modification de l'entente envoyée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (EntenteNonTrouveException e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageRetourDTO(null, new ErrorResponse(ErrorCode.UNKNOWN_ERROR.getCode(), e.getMessage())));
        }
    }
}