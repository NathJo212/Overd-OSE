package com.backend.modele;

import com.backend.service.DTO.ProgrammeDTO;
import com.backend.service.DTO.ProgrammeDTOConverter;
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
    private String date_debut;
    private String date_fin;

    @Convert(converter = ProgrammeDTOConverter.class)
    private ProgrammeDTO progEtude;

    private String lieuStage;
    private String remuneration;
    private String dateLimite;


    @ManyToOne
    @JoinColumn(name = "employeur_id")
    private Employeur employeur;
    private String messageRefus;

    @Enumerated(EnumType.STRING)
    private StatutApprouve statutApprouve;

    public Offre(String titre, String description, String date_debut, String date_fin, ProgrammeDTO progEtude, String lieuStage, String remuneration, String dateLimite, Employeur employeur) {
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
