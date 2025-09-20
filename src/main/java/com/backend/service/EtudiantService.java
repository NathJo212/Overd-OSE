package com.backend.service;

import com.backend.Exceptions.EmailDejaUtilise;
import com.backend.modele.Etudiant;
import com.backend.persistence.EtudiantRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class EtudiantService {

    @Autowired
    private PasswordEncoder passwordEncoder;
    EtudiantRepository etudiantRepository;

    @Transactional
    public void creerEtudiant(String email, String password, String telephone,
                              String prenom, String nom, String progEtude, String session, String annee) {
        boolean etudiantExistant = etudiantRepository.existsByEmail(email);
        String hashedPassword = passwordEncoder.encode(password);
        if (etudiantExistant) {
            throw new EmailDejaUtilise("Un etudiant avec cet email existe déjà");
        }
        Etudiant etudiant = new Etudiant(email, hashedPassword, telephone, nom, prenom, progEtude, session, annee);
        etudiantRepository.save(etudiant);
    }

}
