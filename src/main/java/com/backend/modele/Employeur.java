package com.backend.modele;

import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Employeur extends Utilisateur {

    private String nomEntreprise;
    private String contact;

    public Employeur(String nomEntreprise, String contact) {
        super();
        this.nomEntreprise = nomEntreprise;
        this.contact = contact;

    }


    public Employeur() {

    }


}
