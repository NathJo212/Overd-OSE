package com.backend.service;

import com.backend.Exceptions.EmailDejaUtilise;
import com.backend.modele.Etudiant;
import com.backend.persistence.EtudiantRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class EtudiantService {

    EtudiantRepository etudiantRepository;

    @Transactional
    public Etudiant creerEtudiant(String email, String password, String telephone,
                                  String nom, String prenom, String progEtude, String session, String annee) {
        boolean etudiantExistant = etudiantRepository.existsByEmail(email);
        if (etudiantExistant) {
            throw new EmailDejaUtilise("Un etudiant avec cet email existe déjà");
        }
        Etudiant etudiant = new Etudiant(email, password, telephone, nom, prenom, progEtude, session, annee);
        return etudiantRepository.save(etudiant);
    }

}
