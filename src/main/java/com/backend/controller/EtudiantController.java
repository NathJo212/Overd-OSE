package com.backend.controller;

import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.service.DTO.EtudiantDTO;
import com.backend.service.DTO.MessageRetourDTO;
import com.backend.service.DTO.OffreDTO;
import com.backend.service.EtudiantService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
                    etudiantDTO.getTelephone(), etudiantDTO.getPrenom(), etudiantDTO.getNom(), etudiantDTO.getProgEtude(), etudiantDTO.getSession(), etudiantDTO.getAnnee());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new MessageRetourDTO("Étudiant créé avec succès", null));
        }catch (EmailDejaUtiliseException | MotPasseInvalideException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null, e.getMessage()));
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
