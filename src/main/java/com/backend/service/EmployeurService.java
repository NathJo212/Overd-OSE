package com.backend.service;

import com.backend.Exceptions.AuthentificationEchouee;
import com.backend.Exceptions.EmailDejaUtilise;
import com.backend.config.JwtService;
import com.backend.modele.Employeur;
import com.backend.persistence.EmployeurRepository;
import com.backend.service.DTO.AuthResponseDTO;
import com.backend.service.DTO.EmployeurDTO;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@AllArgsConstructor
public class EmployeurService {

    @Autowired
    private PasswordEncoder passwordEncoder;
    private final EmployeurRepository employeurRepository;
    private final JwtService jwtService;

    @Transactional
    public void creerEmployeur(String email, String password, String telephone, String nomEntreprise, String contact) {
        boolean employeurExistant = employeurRepository.existsByEmail(email);
        String hashedPassword = passwordEncoder.encode(password);
        if (employeurExistant) {
            throw new EmailDejaUtilise("Un employeur avec cet email existe déjà");
        }
        Employeur employeur = new Employeur(email, hashedPassword, telephone, nomEntreprise, contact);
        employeurRepository.save(employeur);
    }

    @Transactional
    public AuthResponseDTO authentifierEmployeur(String email, String password) {
        Optional<Employeur> employeurOptional = employeurRepository.findByEmail(email);

        if (employeurOptional.isEmpty()) {
            throw new AuthentificationEchouee("Mauvaise authentification");
        }

        Employeur employeur = employeurOptional.get();

        if (!passwordEncoder.matches(password, employeur.getPassword())) {
            throw new AuthentificationEchouee("Mauvaise authentification");
        }

        EmployeurDTO employeurDTO = EmployeurDTO.builder()
                .email(employeur.getEmail())
                .telephone(employeur.getTelephone())
                .nomEntreprise(employeur.getNomEntreprise())
                .contact(employeur.getContact())
                .build();

        String token = jwtService.generateTokenWithRole(employeur.getEmail(), "EMPLOYEUR");

        return new AuthResponseDTO(token, employeurDTO);
    }
}
