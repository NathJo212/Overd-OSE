package com.backend.modele;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "entente_stage")
@Getter
@Setter
@NoArgsConstructor
public class EntenteStage {

    public enum StatutEntente {
        EN_ATTENTE,
        SIGNEE,
        ANNULEE
    }

    public enum SignatureStatus {
        EN_ATTENTE,
        SIGNEE,
        REFUSEE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "etudiant_id")
    private Etudiant etudiant;

    @ManyToOne
    @JoinColumn(name = "employeur_id")
    private Employeur employeur;

    @ManyToOne
    @JoinColumn(name = "offre_id")
    private Offre offre;

    private String titre;

    @Column(length = 4000)
    private String description;

    private LocalDate dateDebut;
    private LocalDate dateFin;

    private String horaire;
    private Integer dureeHebdomadaire;
    private String remuneration;

    @Column(length = 4000)
    private String responsabilites;

    @Column(length = 4000)
    private String objectifs;

    private Programme progEtude;
    private String lieu;

    @Column
    private byte[] documentPdf;

    @Enumerated(EnumType.STRING)
    private SignatureStatus etudiantSignature = SignatureStatus.EN_ATTENTE;

    @Enumerated(EnumType.STRING)
    private SignatureStatus employeurSignature = SignatureStatus.EN_ATTENTE;

    @Enumerated(EnumType.STRING)
    private StatutEntente statut = StatutEntente.EN_ATTENTE;

    private boolean archived = false;

    private LocalDateTime dateCreation = LocalDateTime.now();

    public EntenteStage(Etudiant etudiant, Employeur employeur, Offre offre) {
        this.etudiant = etudiant;
        this.employeur = employeur;
        this.offre = offre;
        if (offre != null) {
            this.titre = offre.getTitre();
            this.description = offre.getDescription();
            this.dateDebut = offre.getDate_debut();
            this.dateFin = offre.getDate_fin();
            this.horaire = offre.getHoraire();
            this.dureeHebdomadaire = offre.getDureeHebdomadaire();
            this.remuneration = offre.getRemuneration();
            this.responsabilites = offre.getResponsabilites();
            this.objectifs = offre.getObjectifs();
            this.progEtude = offre.getProgEtude();
            this.lieu = offre.getLieuStage();
        }
        this.archived = false;
        this.dateCreation = LocalDateTime.now();
    }
}
