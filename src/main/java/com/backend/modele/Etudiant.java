package com.backend.modele;


import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Etudiant extends Utilisateur {

    private String nom;
    private String prenom;
    private String progEtude;
    private String session;
    private String annee;

    public Etudiant(String email, String password, String telephone, String prenom, String nom, String progEtude, String session, String annee) {
        super(email, password, telephone);
        this.nom = nom;
        this.prenom = prenom;
        this.progEtude = progEtude;
        this.session = session;
        this.annee = annee;
    }
}
