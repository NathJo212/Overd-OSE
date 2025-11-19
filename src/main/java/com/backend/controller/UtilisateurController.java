package com.backend.controller;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.AuthenticationException;
import com.backend.Exceptions.UtilisateurPasTrouveException;
import com.backend.service.DTO.*;
import com.backend.service.UtilisateurService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/OSE")
@CrossOrigin(origins = "*")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    public UtilisateurController(UtilisateurService utilisateurService) {
        this.utilisateurService = utilisateurService;
    }

    @PostMapping("/login")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginDTO loginDTO) {
        try {
            AuthResponseDTO authResponse = utilisateurService.authentifierUtilisateur(
                    loginDTO.getEmail(),
                    loginDTO.getPassword()
            );
            return ResponseEntity.ok(authResponse);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponseDTO(null,null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponseDTO(null,null, new ErrorResponse("ERROR_000", "Erreur d'authentification")));
        }
    }

    @PostMapping("/logout")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> logout(HttpServletRequest request) {
        try {
            String header = request.getHeader("Authorization");
            if (header == null || !header.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new MessageRetourDTO(null, new ErrorResponse("AUTH_002", "Token manquant ou invalide")));
            }
            String token = header.substring(7);
            utilisateurService.logout(token);

            return ResponseEntity.ok(new MessageRetourDTO("Déconnexion réussie", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, new ErrorResponse("ERROR_000", "Erreur lors de la déconnexion")));
        }
    }

    @GetMapping("/getProgrammes")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<String>> getAllProgrammes() {
        try {
            List<String> programmes = utilisateurService.getAllProgrammes();
            return ResponseEntity.ok(programmes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<Map<String, Object>> searchUsers(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "ALL") String category) {
        try {
            Map<String, Object> results = utilisateurService.searchUsersByCategory(q, category);
            return ResponseEntity.ok(results);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", new ErrorResponse("SEARCH_001", e.getMessage())));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", new ErrorResponse("ERROR_000", "Erreur lors de la recherche")));
        }
    }

    @GetMapping("/info/etudiant/{id}")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<EtudiantDTO> getEtudiantInfo(@PathVariable Long id) {
        try {
            EtudiantDTO etudiant = utilisateurService.getEtudiantInfo(id);
            return ResponseEntity.ok(etudiant);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/info/employeur/{id}")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<EmployeurDTO> getEmployeurInfo(@PathVariable Long id) {
        try {
            EmployeurDTO employeur = utilisateurService.getEmployeurInfo(id);
            return ResponseEntity.ok(employeur);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/info/professeur/{id}")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<ProfesseurDTO> getProfesseurInfo(@PathVariable Long id) {
        try {
            ProfesseurDTO professeur = utilisateurService.getProfesseurInfo(id);
            return ResponseEntity.ok(professeur);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/info/gestionnaire/{id}")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<GestionnaireDTO> getGestionnaireInfo(@PathVariable Long id) {
        try {
            GestionnaireDTO gestionnaire = utilisateurService.getGestionnaireInfo(id);
            return ResponseEntity.ok(gestionnaire);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (UtilisateurPasTrouveException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


}