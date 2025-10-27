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
    private LocalDateTime dateModification = LocalDateTime.now();

    public EntenteStage(Etudiant etudiant, Employeur employeur, Offre offre, String titre, String description, LocalDate dateDebut, LocalDate dateFin,
                        String horaire, Integer dureeHebdomadaire, String remuneration, String responsabilites, String objectifs) {
        this.etudiant = etudiant;
        this.employeur = employeur;
        this.offre = offre;
        this.titre = titre;
        this.description = description;
        this.dateDebut = dateDebut;
        this.dateFin = dateFin;
        this.horaire = horaire;
        this.dureeHebdomadaire = dureeHebdomadaire;
        this.remuneration = remuneration;
        this.responsabilites = responsabilites;
        this.objectifs = objectifs;
        this.archived = false;
        this.dateCreation = LocalDateTime.now();
        this.dateModification = LocalDateTime.now();
    }
}
