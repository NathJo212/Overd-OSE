package com.backend.modele;


import com.backend.auth.Credentials;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

@Entity
@Table
@Getter
@NoArgsConstructor
@AllArgsConstructor
public abstract class Utilisateur {

    @Id
    @GeneratedValue
    protected Long id;

    protected String telephone;

    @Embedded
    private Credentials credentials;

    public Utilisateur(String email, String password, String telephone) {
        this.telephone = telephone;
        this.credentials = Credentials.builder()
                .email(email)
                .password(password)
                .build();
    }

    // Delegate methods to credentials
    public String getEmail() {
        return credentials.getEmail();
    }

    public String getPassword() {
        return credentials.getPassword();
    }

    public Collection<? extends GrantedAuthority> getAuthorities(){
        return credentials.getAuthorities();
    }
}



