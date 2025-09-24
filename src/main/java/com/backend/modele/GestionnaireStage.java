package com.backend.modele;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Setter
@Getter
@NoArgsConstructor
public class GestionnaireStage extends Utilisateur {

    private String nom;
    private String prenom;

    public GestionnaireStage(String email, String password, String telephone, String nom, String prenom) {
        super(email, password, telephone);
        this.nom = nom;
        this.prenom = prenom;
    }
}
