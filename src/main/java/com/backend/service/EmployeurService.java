package com.backend.service;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.config.JwtAuthenticationFilter;
import com.backend.config.JwtTokenProvider;
import com.backend.modele.Employeur;
import com.backend.modele.Offre;
import com.backend.persistence.EmployeurRepository;
import com.backend.persistence.OffreRepository;
import com.backend.service.DTO.AuthResponseDTO;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class EmployeurService {

    private final PasswordEncoder passwordEncoder;
    private final EmployeurRepository employeurRepository;
    private final OffreRepository offreRepository;
    JwtTokenProvider jwtTokenProvider;

    @Autowired
    public EmployeurService(PasswordEncoder passwordEncoder, EmployeurRepository employeurRepository, OffreRepository offreRepository, JwtTokenProvider jwtTokenProvider) {
        this.passwordEncoder = passwordEncoder;
        this.employeurRepository = employeurRepository;
        this.offreRepository = offreRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public void creerEmployeur(String email, String password, String telephone, String nomEntreprise, String contact) throws MotPasseInvalideException, EmailDejaUtiliseException {
        boolean employeurExistant = employeurRepository.existsByEmail(email);
        if (employeurExistant) {
            throw new EmailDejaUtiliseException("Un utilisateur avec cet email existe déjà");
        }
        String regex = "^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$";
        if (!Pattern.matches(regex, password)) {
            throw new MotPasseInvalideException("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.");
        }
        String hashedPassword = passwordEncoder.encode(password);
        Employeur employeur = new Employeur(email, hashedPassword, telephone, nomEntreprise, contact);
        employeurRepository.save(employeur);
    }

    @Transactional
    public void creerOffreDeStage(AuthResponseDTO utilisateur, String titre, String description, String date_debut, String date_fin, String progEtude, String lieuStage, String remuneration, String dateLimite) throws ActionNonAutoriseeException {
        String token = utilisateur.getToken();
        boolean isEmployeur = jwtTokenProvider.isEmployeur(token, jwtTokenProvider);
        if (!isEmployeur) {
            throw new ActionNonAutoriseeException("Seul un employeur peut créer une offre de stage.");
        }
        String email = jwtTokenProvider.getEmailFromJWT(token.startsWith("Bearer ") ? token.substring(7) : token);
        Employeur employeur = employeurRepository.findByEmail(email);
        Offre offre = new Offre(titre, description, date_debut, date_fin, progEtude, lieuStage, remuneration, dateLimite, employeur);
        offreRepository.save(offre);
    }
}
