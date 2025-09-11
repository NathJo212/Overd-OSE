package com.backend.modele;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table
public abstract class Utilisateur {

    @Id
    @GeneratedValue
    protected Long id;

    protected String email;
    protected String password;
    protected String telephone;

    public Utilisateur() {
    }

    public Utilisateur(String email, String password, String telephone) {
        this.email = email;
        this.password = password;
        this.telephone = telephone;
    }

}
