package com.backend.service;

import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.modele.Etudiant;
import com.backend.persistence.EtudiantRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class EtudiantService {

    private final PasswordEncoder passwordEncoder;
    private final EtudiantRepository etudiantRepository;

    public EtudiantService(PasswordEncoder passwordEncoder, EtudiantRepository etudiantRepository) {
        this.passwordEncoder = passwordEncoder;
        this.etudiantRepository = etudiantRepository;
    }

    @Transactional
    public void creerEtudiant(String email, String password, String telephone,
                              String prenom, String nom, String progEtude, String session, String annee) throws MotPasseInvalideException, EmailDejaUtiliseException {
        boolean etudiantExistant = etudiantRepository.existsByEmail(email);
        if (etudiantExistant) {
            throw new EmailDejaUtiliseException("Un utilisateur avec cet email existe déjà");
        }
        String regex = "^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,}$";
        if (!Pattern.matches(regex, password)) {
            throw new MotPasseInvalideException("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.");
        }
        String hashedPassword = passwordEncoder.encode(password);
        Etudiant etudiant = new Etudiant(email, hashedPassword, telephone, nom, prenom, progEtude, session, annee);
        etudiantRepository.save(etudiant);
    }

}
