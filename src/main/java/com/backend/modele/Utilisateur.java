package com.backend.modele;


import jakarta.persistence.*;
import lombok.NoArgsConstructor;

@Entity
@Table
@NoArgsConstructor
public abstract class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    protected Long id;

    protected String email;
    protected String password;
    protected String telephone;


    public Utilisateur(String email, String password, String telephone) {
        this.email = email;
        this.password = password;
        this.telephone = telephone;
    }



}
