package com.backend.modele;


import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Setter
@Getter
public class Etudiant extends Utilisateur {

    private String nom;
    private String prenom;
    private String progEtude;
    private String session;
    private String annee;

    public Etudiant() {
    }

    public Etudiant(String nom, String prenom, String progEtude, String session, String annee) {
        super();
        this.nom = nom;
        this.prenom = prenom;
        this.progEtude = progEtude;
        this.session = session;
        this.annee = annee;

    }



}
