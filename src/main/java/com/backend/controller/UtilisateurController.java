package com.backend.controller;

import com.backend.service.DTO.AuthResponseDTO;
import com.backend.service.DTO.LoginDTO;
import com.backend.service.DTO.MessageRetourDTO;
import com.backend.service.UtilisateurService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/logout")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> logout(@RequestBody AuthResponseDTO authResponseDTO) {
        try {
            utilisateurService.logout(authResponseDTO.getToken());
            return ResponseEntity.ok(new MessageRetourDTO("Déconnexion réussie", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageRetourDTO(null, "Erreur lors de la déconnexion"));
        }
    }
}