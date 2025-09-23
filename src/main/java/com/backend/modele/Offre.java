package com.backend.modele;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table
@Getter
@Setter
@NoArgsConstructor
public class Offre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    private String description;
    private String date_debut;
    private String date_fin;
    private String progEtude;
    private String lieuStage;
    private String remuneration;
    private String dateLimite;

    @ManyToOne
    @JoinColumn(name = "employeur_id")
    private Employeur employeur;
    private boolean approuve;


    public Offre(String titre, String description, String date_debut, String date_fin, String progEtude, String lieuStage, String remuneration, String dateLimite, Employeur employeur) {
        this.titre = titre;
        this.description = description;
        this.date_debut = date_debut;
        this.date_fin = date_fin;
        this.progEtude = progEtude;
        this.lieuStage = lieuStage;
        this.remuneration = remuneration;
        this.dateLimite = dateLimite;
        this.employeur = employeur;
        this.approuve = false;
    }
}
