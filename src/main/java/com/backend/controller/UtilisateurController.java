package com.backend.controller;

import com.backend.Exceptions.AuthenticationException;
import com.backend.Exceptions.UserNotFoundException;
import com.backend.service.DTO.AuthResponseDTO;
import com.backend.service.DTO.ErrorResponse;
import com.backend.service.DTO.LoginDTO;
import com.backend.service.DTO.MessageRetourDTO;
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
    public ResponseEntity<?> login(@RequestBody LoginDTO loginDTO) {
        try {
            AuthResponseDTO authResponse = utilisateurService.authentifierUtilisateur(
                    loginDTO.getEmail(),
                    loginDTO.getPassword()
            );
            return ResponseEntity.ok(authResponse);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getErrorCode().getCode(), e.getMessage()));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getErrorCode().getCode(), e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("ERROR_000", "Erreur d'authentification"));
        }
    }

    @PostMapping("/logout")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        try {
            String header = request.getHeader("Authorization");
            if (header == null || !header.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("AUTH_002", "Token manquant ou invalide"));
            }
            String token = header.substring(7);
            utilisateurService.logout(token);

            return ResponseEntity.ok(new MessageRetourDTO("Déconnexion réussie", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("ERROR_000", "Erreur lors de la déconnexion"));
        }
    }

    @GetMapping("/getProgrammes")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<?> getAllProgrammes() {
        try {
            List<String> programmes = utilisateurService.getAllProgrammes();  // Changed from Map<String, String>
            return ResponseEntity.ok(programmes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR_000", "Erreur lors de la récupération des programmes"));
        }
    }
}