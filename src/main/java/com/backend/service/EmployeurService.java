package com.backend.service;

import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.modele.Employeur;
import com.backend.modele.Offre;
import com.backend.persistence.EmployeurRepository;
import com.backend.persistence.OffreRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class EmployeurService {

    private final PasswordEncoder passwordEncoder;
    private final EmployeurRepository employeurRepository;
    private final OffreRepository offreRepository;

    @Autowired
    public EmployeurService(PasswordEncoder passwordEncoder, EmployeurRepository employeurRepository, OffreRepository offreRepository) {
        this.passwordEncoder = passwordEncoder;
        this.employeurRepository = employeurRepository;
        this.offreRepository = offreRepository;
    }

    @Transactional
    public void creerEmployeur(String email, String password, String telephone, String nomEntreprise, String contact) throws MotPasseInvalideException, EmailDejaUtiliseException {
        boolean employeurExistant = employeurRepository.existsByEmail(email);
        if (employeurExistant) {
            throw new EmailDejaUtiliseException("Un employeur avec cet email existe déjà");
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
    public void creerOffreDeStage(String titre, String description, String date_debut, String date_fin, String progEtude, String lieuStage, String Remuneration, String dateLimite){
        //Vérification si user est un employeur (à faire)

        Offre offre = new Offre(titre,description, date_debut, date_fin, progEtude, lieuStage, Remuneration, dateLimite);
        offreRepository.save(offre);
    }

}
