package com.backend.modele;


import com.backend.service.DTO.ProgrammeDTO;
import com.backend.service.DTO.ProgrammeDTOConverter;
import jakarta.persistence.Convert;
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

    @Convert(converter = ProgrammeDTOConverter.class)
    private Programme progEtude;


    private String session;
    private String annee;

    public Etudiant(String email, String password, String telephone, String prenom, String nom, Programme progEtude, String session, String annee) {
        super(email, password, telephone);
        this.nom = nom;
        this.prenom = prenom;
        this.progEtude = progEtude;
        this.session = session;
        this.annee = annee;
    }
}
