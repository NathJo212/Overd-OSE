package com.backend.persistence;

import com.backend.modele.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    // Method 1: Use the embedded credentials email field
    Optional<Utilisateur> findByEmail(String email);

}