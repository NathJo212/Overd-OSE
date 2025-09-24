package com.backend.service;

import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.modele.Etudiant;
import com.backend.persistence.EtudiantRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
                              String prenom, String nom, String progEtude, String session, String annee) {
        boolean etudiantExistant = etudiantRepository.existsByEmail(email);
        String hashedPassword = passwordEncoder.encode(password);
        if (etudiantExistant) {
            throw new EmailDejaUtiliseException("Un utilisateur avec cet email existe déjà");
        }
        Etudiant etudiant = new Etudiant(email, hashedPassword, telephone, nom, prenom, progEtude, session, annee);
        etudiantRepository.save(etudiant);
    }

}
