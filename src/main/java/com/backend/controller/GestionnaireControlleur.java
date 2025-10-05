package com.backend.controller;

import com.backend.Exceptions.*;
import com.backend.service.DTO.ErrorResponse;
import com.backend.service.DTO.EtudiantDTO;
import com.backend.service.DTO.MessageRetourDTO;
import com.backend.service.DTO.OffreDTO;
import com.backend.service.GestionnaireService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

}
