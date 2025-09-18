package com.backend.service;

import com.backend.Exceptions.EmailDejaUtilise;
import com.backend.Exceptions.InvalidMotPasseException;
import com.backend.modele.Etudiant;
import com.backend.persistence.EtudiantRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
@AllArgsConstructor
public class EtudiantService {

    @Autowired
    private PasswordEncoder passwordEncoder;
    EtudiantRepository etudiantRepository;

    @Transactional
    public void creerEtudiant(String email, String password, String telephone,
                              String prenom, String nom, String progEtude, String session, String annee) throws InvalidMotPasseException, EmailDejaUtilise {
        boolean etudiantExistant = etudiantRepository.existsByEmail(email);
        if (etudiantExistant) {
            throw new EmailDejaUtilise("Un etudiant avec cet email existe déjà");
        }
        String regex = "^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,}$";
        if (!Pattern.matches(regex, password)) {
            throw new InvalidMotPasseException("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.");
        }
        String hashedPassword = passwordEncoder.encode(password);
        Etudiant etudiant = new Etudiant(email, hashedPassword, telephone, nom, prenom, progEtude, session, annee);
        etudiantRepository.save(etudiant);
    }

}
