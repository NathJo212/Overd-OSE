package com.backend.modele;

import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Employeur extends Utilisateur {

    private String nomEntreprise;
    private String contact;

    public Employeur(String email, String password, String telephone,
                     String nomEntreprise, String contact) {
        super(email, password, telephone);
        this.nomEntreprise = nomEntreprise;
        this.contact = contact;
    }
}
