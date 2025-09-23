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
@AllArgsConstructor
@NoArgsConstructor
public class GestionnaireStage {

    @Id
    @GeneratedValue
    private Long id;

    private String nom;
    private String prenom;

    public GestionnaireStage(String nom, String prenom) {
        this.nom = nom;
        this.prenom = prenom;
    }

}
