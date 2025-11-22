package com.backend.modele;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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

    // Additional fields used to prefill EntenteStage
    private String horaire;
    private Integer dureeHebdomadaire;

    private String responsabilitesEtudiant;
    private String responsabilitesEmployeur;
    private String responsabilitesCollege;

    private String objectifs;

    @ManyToOne
    @JoinColumn(name = "employeur_id")
    private Employeur employeur;

    private String messageRefus;

    @Enumerated(EnumType.STRING)
    private StatutApprouve statutApprouve;

    @OneToMany(mappedBy = "offre", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Candidature> candidatures = new ArrayList<>();

    // Session académique de l'offre (ex: "HIVER_2025", "AUTOMNE_2024", "ETE_2025")
    private String sessionAcademique;

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
        // initialize new fields to null by default
        this.horaire = null;
        this.dureeHebdomadaire = null;
        this.responsabilitesEtudiant = null;
        this.responsabilitesEmployeur = null;
        this.objectifs = null;
        // Initialiser la session académique basée sur la date de début
        if (date_debut != null) {
            AcademicSession.Session session = AcademicSession.getSessionForDate(date_debut);
            int year = date_debut.getYear();
            this.sessionAcademique = session.name() + "_" + year;
        } else {
            AcademicSession.Session currentSession = AcademicSession.getCurrentSession();
            int currentYear = java.time.LocalDate.now().getYear();
            this.sessionAcademique = currentSession.name() + "_" + currentYear;
        }
    }

    public Offre(String titre, String description, LocalDate date_debut, LocalDate date_fin, Programme progEtude, String lieuStage, String remuneration, LocalDate dateLimite, Employeur employeur, String horaire, Integer dureeHebdomadaire, String responsabilitesEtudiant, String responsabilitesEmployeur,String responsabilitesCollege, String objectifs) {
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
        this.horaire = horaire;
        this.dureeHebdomadaire = dureeHebdomadaire;
        this.responsabilitesEtudiant = responsabilitesEtudiant;
        this.responsabilitesEmployeur = responsabilitesEmployeur;
        this.responsabilitesCollege = responsabilitesCollege;
        this.objectifs = objectifs;
        // Initialiser la session académique basée sur la date de début
        if (date_debut != null) {
            AcademicSession.Session session = AcademicSession.getSessionForDate(date_debut);
            int year = date_debut.getYear();
            this.sessionAcademique = session.name() + "_" + year;
        } else {
            AcademicSession.Session currentSession = AcademicSession.getCurrentSession();
            int currentYear = java.time.LocalDate.now().getYear();
            this.sessionAcademique = currentSession.name() + "_" + currentYear;
        }
    }

}