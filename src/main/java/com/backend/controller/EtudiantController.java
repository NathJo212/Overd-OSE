package com.backend.controller;

import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.service.DTO.ErrorResponse;
import com.backend.service.DTO.CvDTO;
import com.backend.service.DTO.EtudiantDTO;
import com.backend.service.DTO.MessageRetourDTO;
import com.backend.service.DTO.OffreDTO;
import com.backend.service.EtudiantService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

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

}
