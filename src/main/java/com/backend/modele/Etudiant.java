package com.backend.modele;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Etudiant extends Utilisateur {

    private String nom;
    private String prenom;

    @Convert(converter = ProgrammeConverter.class)
    private Programme progEtude;


    private String session;
    private String annee;

    private byte[] cv;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_cv")
    private StatutCV statutCV = StatutCV.AUCUN;

    @Column(name = "message_refus_cv", length = 1000)
    private String messageRefusCV;

    public enum StatutCV {
        ATTENTE,
        APPROUVE,
        REFUSE,
        AUCUN
    }

    @ManyToOne
    private Professeur professeur;

    @OneToMany(mappedBy = "etudiant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Candidature> candidatures = new ArrayList<>();

    public Etudiant(String email, String password, String telephone, String prenom, String nom,
                    Programme progEtude, String session, String annee) {
        super(email, password, telephone);
        this.nom = nom;
        this.prenom = prenom;
        this.progEtude = progEtude;
        this.session = session;
        this.annee = annee;
    }
}
