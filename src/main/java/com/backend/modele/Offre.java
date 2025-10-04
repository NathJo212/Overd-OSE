package com.backend.modele;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table
@Getter
@Setter
@NoArgsConstructor
public class Offre {

    public enum StatutApprouve {
        ATTENTE,
        APPROUVE,
        REFUSE
    }



    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    private String description;
    private LocalDate date_debut;
    private LocalDate date_fin;

    @Convert(converter = ProgrammeConverter.class)
    private Programme progEtude;

    private String lieuStage;
    private String remuneration;
    private LocalDate dateLimite;


    @ManyToOne
    @JoinColumn(name = "employeur_id")
    private Employeur employeur;
    private String messageRefus;

    @Enumerated(EnumType.STRING)
    private StatutApprouve statutApprouve;

    public Offre(String titre, String description, LocalDate date_debut, LocalDate date_fin, Programme progEtude, String lieuStage, String remuneration, LocalDate dateLimite, Employeur employeur) {
        this.titre = titre;
        this.description = description;
        this.date_debut = date_debut;
        this.date_fin = date_fin;
        this.progEtude = progEtude;
        this.lieuStage = lieuStage;
        this.remuneration = remuneration;
        this.dateLimite = dateLimite;
        this.employeur = employeur;
        this.statutApprouve = StatutApprouve.ATTENTE;
    }
}
