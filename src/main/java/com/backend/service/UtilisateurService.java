package com.backend.service;

import com.backend.Exceptions.AuthentificationEchouee;
import com.backend.config.JwtService;
import com.backend.modele.Employeur;
import com.backend.modele.Etudiant;
import com.backend.modele.Utilisateur;
import com.backend.persistence.UtilisateurRepository;
import com.backend.service.DTO.AuthResponseDTO;
import com.backend.service.DTO.EmployeurDTO;
import com.backend.service.DTO.UtilisateurDTO;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@AllArgsConstructor
public class UtilisateurService {

    @Autowired
    private PasswordEncoder passwordEncoder;
    private final UtilisateurRepository utilisateurRepository;
    private final JwtService jwtService;

    @Transactional
    public AuthResponseDTO authentifierUtilisateur(String email, String password) {
        Optional<Utilisateur> utilisateurOptional = utilisateurRepository.findByEmail(email);

        if (utilisateurOptional.isEmpty()) {
            throw new AuthentificationEchouee("Mauvaise authentification");
        }

        Utilisateur utilisateur = utilisateurOptional.get();

        if (!passwordEncoder.matches(password, utilisateur.getPassword())) {
            throw new AuthentificationEchouee("Mauvaise authentification");
        }

        UtilisateurDTO utilisateurDTO = UtilisateurDTO.toDTO(utilisateur);

        String role = determineUserRole(utilisateur);

        String token = jwtService.generateTokenWithRole(utilisateur.getEmail(), role);

        return new AuthResponseDTO(token, utilisateurDTO);
    }

    private String determineUserRole(Utilisateur utilisateur) {
        return switch (utilisateur) {
            case Employeur employeur -> "EMPLOYEUR";
            case Etudiant etudiant -> "ETUDIANT";
            default -> "UTILISATEUR";
        };
    }


}
