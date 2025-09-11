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
    public Employeur save(String nomEntreprise) {
        return null;
    }

}
