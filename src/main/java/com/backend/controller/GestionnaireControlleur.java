package com.backend.controller;

import com.backend.Exceptions.*;
import com.backend.service.DTO.*;
import com.backend.service.GestionnaireService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/OSEGestionnaire")
public class GestionnaireControlleur {

    private final GestionnaireService gestionnaireService;

    public GestionnaireControlleur(GestionnaireService gestionnaireService) {
        this.gestionnaireService = gestionnaireService;
    }

    @PostMapping("/approuveOffre")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> approuveOffre(@RequestBody OffreDTO offreDTO) {
        Long id = offreDTO.getId();
        if (id == null) {
            return ResponseEntity.badRequest()
                    .body(new MessageRetourDTO(null, new ErrorResponse("VALIDATION_003", "ID de l'offre manquant")));
        }
        try {
            gestionnaireService.approuveOffre(id);
            return ResponseEntity.ok(new MessageRetourDTO("Offre approuvée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (OffreNonExistantException e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (OffreDejaVerifieException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        }
    }

    @PostMapping("/refuseOffre")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> refuseOffre(@RequestBody OffreDTO offreDTO) {
        Long id = offreDTO.getId();
        if (id == null) {
            return ResponseEntity.badRequest()
                    .body(new MessageRetourDTO(null, new ErrorResponse("VALIDATION_003", "ID de l'offre manquant")));
        }
        try {
            gestionnaireService.refuseOffre(id, offreDTO.getMessageRefus());
            return ResponseEntity.ok(new MessageRetourDTO("Offre refusée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (OffreNonExistantException e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (OffreDejaVerifieException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        }
    }

    @GetMapping("/offresEnAttente")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<OffreDTO>> offreEnAttente() {
        try {
            List<OffreDTO> offresEnAttente = gestionnaireService.getOffresAttente();
            return ResponseEntity.ok(offresEnAttente);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/visualiserOffres")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<OffreDTO>> getAllOffres() {
        try {
            List<OffreDTO> toutesLesOffres = gestionnaireService.getAllOffres();
            return ResponseEntity.ok(toutesLesOffres);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/approuveCV")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> approuveCV(@RequestBody EtudiantDTO etudiantDTO) {
        Long id = etudiantDTO.getId();
        if (id == null) {
            return ResponseEntity.badRequest()
                    .body(new MessageRetourDTO(null, new ErrorResponse("VALIDATION_003", "ID de l'étudiant manquant")));
        }
        try {
            gestionnaireService.approuveCV(id);
            return ResponseEntity.ok(new MessageRetourDTO("CV approuvé avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (CVNonExistantException e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (CVDejaVerifieException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        }
    }

    @PostMapping("/refuseCV")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> refuseCV(@RequestBody EtudiantDTO etudiantDTO) {
        Long id = etudiantDTO.getId();
        if (id == null) {
            return ResponseEntity.badRequest()
                    .body(new MessageRetourDTO(null, new ErrorResponse("VALIDATION_003", "ID de l'étudiant manquant")));
        }
        try {
            gestionnaireService.refuseCV(id, etudiantDTO.getMessageRefusCV());
            return ResponseEntity.ok(new MessageRetourDTO("CV refusé avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (CVNonExistantException e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (CVDejaVerifieException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        }
    }

    @GetMapping("/CVsEnAttente")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<EtudiantDTO>> getCVsEnAttente() {
        try {
            List<EtudiantDTO> cvsEnAttente = gestionnaireService.getCVsEnAttente();
            return ResponseEntity.ok(cvsEnAttente);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/candidaturesEligiblesEntente")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<CandidatureDTO>> getCandidaturesEligiblesEntente() {
        try{
            List<CandidatureDTO> candidaturesEligiblesEntente = gestionnaireService.getCandidaturesEligiblesEntente();
            return ResponseEntity.ok(candidaturesEligiblesEntente);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/ententes")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> creerEntente(@RequestBody EntenteStageDTO ententeDTO) {
        try {
            gestionnaireService.creerEntente(ententeDTO);
            return ResponseEntity.status(HttpStatus.OK).body(new MessageRetourDTO("Entente créée avec succès", null));
        } catch (OffreNonExistantException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse("UTILISATEUR_NOT_FOUND", e.getMessage())));
        } catch (CandidatureNonTrouveeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (EntenteDejaExistanteException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (StatutCandidatureInvalideException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageRetourDTO(null, new ErrorResponse("ERROR_000", e.getMessage())));
        }
    }

    @PutMapping("/ententes/{id}")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> modifierEntente(@PathVariable Long id, @RequestBody EntenteStageDTO ententeDTO) {
        try {
            gestionnaireService.modifierEntente(id, ententeDTO);
            return ResponseEntity.status(HttpStatus.OK).body(new MessageRetourDTO("Entente modifiée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse("UTILISATEUR_NOT_FOUND", e.getMessage())));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null, new ErrorResponse("ERROR_001", e.getMessage())));
        }
    }

    @PostMapping("/ententes/{id}/annuler")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> annulerEntente(@PathVariable Long id) {
        try {
            gestionnaireService.annulerEntente(id);
            return ResponseEntity.ok(new MessageRetourDTO("Entente annulée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse("ENTENTE_NOT_FOUND", e.getMessage())));
        }
    }

    @GetMapping("/ententes")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<EntenteStageDTO>> getEntentes() {
        try {
            return ResponseEntity.ok(gestionnaireService.getEntentesActives());
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/ententes/{id}")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<EntenteStageDTO> getEntenteById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(gestionnaireService.getEntenteById(id));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/ententes/{id}/document")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<Resource> getEntenteDocument(@PathVariable Long id) {
        try {
            byte[] pdf = gestionnaireService.getEntenteDocument(id);
            ByteArrayResource resource = new ByteArrayResource(pdf);
            String filename = String.format("entente_%d.pdf", id);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (com.backend.Exceptions.ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/etudiant/{etudiantId}/professeur/{professeurId}")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> setEtudiantAProfesseur(
            @PathVariable Long etudiantId,
            @PathVariable Long professeurId) {
        try {
            gestionnaireService.setEtudiantAProfesseur(professeurId, etudiantId);
            return ResponseEntity.ok(new MessageRetourDTO("Professeur assigné à l'étudiant avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse("USER_NOT_FOUND", e.getMessage())));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageRetourDTO(null, new ErrorResponse("ERROR_000", e.getMessage())));
        }
    }


}