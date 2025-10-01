package com.backend.controller;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.OffreDejaVerifieException;
import com.backend.Exceptions.OffreNonExistantException;
import com.backend.service.DTO.ErrorResponse;
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
    public ResponseEntity<?> approuveOffre(@RequestBody OffreDTO offreDTO) {
        Long id = offreDTO.getId();
        if (id == null) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("VALIDATION_003", "ID de l'offre manquant"));
        }
        try {
            gestionnaireService.approuveOffre(id);
            return ResponseEntity.ok(new MessageRetourDTO("Offre approuvée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getErrorCode().getCode(), e.getMessage()));
        } catch (OffreNonExistantException e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getErrorCode().getCode(), e.getMessage()));
        } catch (OffreDejaVerifieException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse(e.getErrorCode().getCode(), e.getMessage()));
        }
    }

    @PostMapping("/refuseOffre")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<?> refuseOffre(@RequestBody OffreDTO offreDTO) {
        Long id = offreDTO.getId();
        if (id == null) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("VALIDATION_003", "ID de l'offre manquant"));
        }
        try {
            gestionnaireService.refuseOffre(id, offreDTO.getMessageRefus());
            return ResponseEntity.ok(new MessageRetourDTO("Offre refusée avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getErrorCode().getCode(), e.getMessage()));
        } catch (OffreNonExistantException e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getErrorCode().getCode(), e.getMessage()));
        } catch (OffreDejaVerifieException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse(e.getErrorCode().getCode(), e.getMessage()));
        }
    }

    @GetMapping("/offresEnAttente")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<?> offreEnAttente() {
        try {
            List<OffreDTO> offresEnAttente = gestionnaireService.getOffresAttente();
            return ResponseEntity.ok(offresEnAttente);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getErrorCode().getCode(), e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR_000", "Erreur interne du serveur"));
        }
    }
}
