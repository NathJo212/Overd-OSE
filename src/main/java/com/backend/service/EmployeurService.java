package com.backend.service;

import com.backend.modele.Employeur;
import com.backend.persistence.EmployeurRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class EmployeurService {

    EmployeurRepository employeurRepository;

    @Transactional
    public Employeur creerEmployeur(String email, String password, String telephone,
                                    String nomEntreprise, String contact) {
        Employeur employeur = new Employeur(email, password, telephone, nomEntreprise, contact);
        return employeurRepository.save(employeur);
    }

}
