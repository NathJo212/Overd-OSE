package com.backend.service;


import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.Exceptions.UtilisateurPasTrouveException;
import com.backend.modele.Professeur;
import com.backend.persistence.ProfesseurRepository;
import com.backend.persistence.UtilisateurRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class ProfesseurService {

    private final ProfesseurRepository professeurRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;


    public ProfesseurService(ProfesseurRepository professeurRepository, UtilisateurRepository utilisateurRepository, PasswordEncoder passwordEncoder) {
        this.professeurRepository = professeurRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void creerProfesseur(String email, String password, String telephone, String prenom, String nom) throws MotPasseInvalideException, EmailDejaUtiliseException {
        boolean professeurExistant = utilisateurRepository.existsByEmail(email);
        if (professeurExistant) {
            throw new EmailDejaUtiliseException();
        }
        String regex = "^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$";
        if (!Pattern.matches(regex, password)) {
            throw new MotPasseInvalideException();
        }
        String hashedPassword = passwordEncoder.encode(password);
        Professeur professeur = new Professeur(email, hashedPassword, telephone, nom, prenom);
        professeurRepository.save(professeur);
    }

    public Professeur getProfesseurConnecte() throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isProfesseur = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("PROFESSEUR"));
        if (!isProfesseur) {
            throw new ActionNonAutoriseeException();
        }
        String email = auth.getName();
        if (professeurRepository.existsByEmail(email)){
            return professeurRepository.findByEmail(email);
        }
        throw new UtilisateurPasTrouveException();
    }


}
