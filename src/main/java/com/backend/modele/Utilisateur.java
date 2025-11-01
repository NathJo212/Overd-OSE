package com.backend.modele;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.List;

@Entity
@Table
@Getter
@NoArgsConstructor
public abstract class Utilisateur {

    @Id
    @GeneratedValue
    protected Long id;

    @Column(unique = true)
    @Setter
    protected String email;
    protected String password;
    protected String telephone;

    public Collection<? extends GrantedAuthority> getAuthorities() {
        String role = switch (this) {
            case Employeur _ -> "EMPLOYEUR";
            case Etudiant _ -> "ETUDIANT";
            case GestionnaireStage _ -> "GESTIONNAIRE";
            case Professeur _ -> "PROFESSEUR";
            default -> "UTILISATEUR";
        };
        return List.of(new SimpleGrantedAuthority(role));
    }

    public Utilisateur(String email, String password, String telephone) {
        this.email = email;
        this.password = password;
        this.telephone = telephone;
    }

}
