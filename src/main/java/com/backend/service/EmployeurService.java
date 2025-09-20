package com.backend.service;

import com.backend.Exceptions.AuthentificationEchouee;
import com.backend.Exceptions.EmailDejaUtilise;
import com.backend.Exceptions.InvalidMotPasseException;
import com.backend.config.JwtService;
import com.backend.modele.Employeur;
import com.backend.modele.Offre;
import com.backend.persistence.EmployeurRepository;
import com.backend.persistence.OffreRepository;
import com.backend.service.DTO.AuthResponseDTO;
import com.backend.service.DTO.EmployeurDTO;
import com.backend.service.DTO.OffreDTO;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.regex.Pattern;

@Service
@AllArgsConstructor
public class EmployeurService {

    @Autowired
    private PasswordEncoder passwordEncoder;
    private final EmployeurRepository employeurRepository;
    private final JwtService jwtService;
    private final OffreRepository offreRepository;

    @Transactional
    public void creerEmployeur(String email, String password, String telephone, String nomEntreprise, String contact) throws InvalidMotPasseException, EmailDejaUtilise {
        boolean employeurExistant = employeurRepository.existsByEmail(email);
        if (employeurExistant) {
            throw new EmailDejaUtilise("Un employeur avec cet email existe déjà");
        }
        String regex = "^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,}$";
        if (!Pattern.matches(regex, password)) {
            throw new InvalidMotPasseException("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.");
        }
        String hashedPassword = passwordEncoder.encode(password);
        Employeur employeur = new Employeur(email, hashedPassword, telephone, nomEntreprise, contact);
        employeurRepository.save(employeur);
    }

    @Transactional
    public void creerOffreDeStage(String titre, String description, String date_debut, String date_fin, String progEtude, String lieuStage, String Remuneration, String dateLimite){
        //Vérification si user est un employeur (à faire)

        Offre offre = new Offre(titre,description, date_debut, date_fin, progEtude, lieuStage, Remuneration, dateLimite);
        offreRepository.save(offre);
    }
}
