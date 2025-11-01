package com.backend.modele;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Professeur extends Utilisateur {


    private String nom;
    private String prenom;

    @OneToMany(mappedBy = "professeur", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Etudiant> etudiantList = new ArrayList<>();


    public Professeur(String email, String password, String telephone, String nom, String prenom) {
        super(email, password, telephone);
        this.nom = nom;
        this.prenom = prenom;


    }
}
