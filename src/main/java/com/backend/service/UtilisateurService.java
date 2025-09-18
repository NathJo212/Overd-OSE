package com.backend.service;

import com.backend.Exceptions.AuthentificationEchouee;
import com.backend.auth.Role;
import com.backend.config.JwtService;
import com.backend.modele.Employeur;
import com.backend.modele.Etudiant;
import com.backend.modele.Utilisateur;
import com.backend.persistence.UtilisateurRepository;
import com.backend.service.DTO.AuthResponseDTO;
import com.backend.service.DTO.UtilisateurDTO;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final PasswordEncoder passwordEncoder;
    private final UtilisateurRepository utilisateurRepository;
    private final JwtService jwtService;

    @Transactional
    public AuthResponseDTO authentifierUtilisateur(String email, String password) {
        // Use the method that works with your data structure
        Optional<Utilisateur> utilisateurOptional = utilisateurRepository.findByCredentialsEmail(email);

        if (utilisateurOptional.isEmpty()) {
            throw new AuthentificationEchouee("Mauvaise authentification");
        }

        Utilisateur utilisateur = utilisateurOptional.get();

        // Get the actual password from the right source
        String storedPassword = getStoredPassword(utilisateur);

        if (!passwordEncoder.matches(password, storedPassword)) {
            throw new AuthentificationEchouee("Mauvaise authentification");
        }

        // Create authentication object for JWT generation
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                getEmail(utilisateur),
                null,
                utilisateur.getAuthorities()
        );

        // Generate token using the authentication object
        String token = jwtService.generateToken(authentication);

        UtilisateurDTO utilisateurDTO = UtilisateurDTO.toDTO(utilisateur);

        return new AuthResponseDTO(token, utilisateurDTO);
    }

    private String getStoredPassword(Utilisateur utilisateur) {
        if (utilisateur.getCredentials() != null &&
                utilisateur.getCredentials().getPassword() != null) {
            return utilisateur.getCredentials().getPassword();
        }
        return utilisateur.getPassword();
    }

    private String getEmail(Utilisateur utilisateur) {
        if (utilisateur.getCredentials() != null &&
                utilisateur.getCredentials().getEmail() != null) {
            return utilisateur.getCredentials().getEmail();
        }
        return utilisateur.getEmail();
    }

    public String determineUserRole(Utilisateur utilisateur) {
        return switch (utilisateur) {
            case Employeur employeur -> Role.EMPLOYEUR.name();
            case Etudiant etudiant -> Role.ETUDIANT.name();
            default -> "UTILISATEUR";
        };
    }
}