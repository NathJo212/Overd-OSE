package com.backend.service;

import com.backend.Exceptions.EmailDejaUtilise;
import com.backend.Exceptions.InvalidMotPasseException;
import com.backend.modele.Employeur;
import com.backend.persistence.EmployeurRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class EmployeurService {

    private final PasswordEncoder passwordEncoder;
    private final EmployeurRepository employeurRepository;

    @Autowired
    public EmployeurService(PasswordEncoder passwordEncoder, EmployeurRepository employeurRepository) {
        this.passwordEncoder = passwordEncoder;
        this.employeurRepository = employeurRepository;
    }

    @Transactional
    public void creerEmployeur(String email, String password, String telephone, String nomEntreprise, String contact) throws InvalidMotPasseException, EmailDejaUtilise {
        boolean employeurExistant = employeurRepository.existsByEmail(email);
        if (employeurExistant) {
            throw new EmailDejaUtilise("Un employeur avec cet email existe déjà");
        }
        String regex = "^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$";
        if (!Pattern.matches(regex, password)) {
            throw new InvalidMotPasseException("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.");
        }
        String hashedPassword = passwordEncoder.encode(password);
        Employeur employeur = new Employeur(email, hashedPassword, telephone, nomEntreprise, contact);
        employeurRepository.save(employeur);
    }

}
