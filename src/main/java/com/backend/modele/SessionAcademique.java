package com.backend.modele;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "session_academique")
@Getter
@Setter
@NoArgsConstructor
public class SessionAcademique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Session session;

    @Column(nullable = false, length = 4)
    private String annee;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(name = "est_courante", nullable = false)
    private boolean estCourante = false;

    @Column(name = "est_active", nullable = false)
    private boolean estActive = true;

    public SessionAcademique(Session session, String annee, LocalDate dateDebut, LocalDate dateFin) {
        this.session = session;
        this.annee = annee;
        this.dateDebut = dateDebut;
        this.dateFin = dateFin;
        this.estCourante = false;
        this.estActive = true;
    }

    public String getNomComplet() {
        return session.getNom() + " " + annee;
    }

    public boolean estFuture(LocalDate dateReference) {
        return dateDebut.isAfter(dateReference);
    }

    public boolean estPassee(LocalDate dateReference) {
        return dateFin.isBefore(dateReference);
    }

    public boolean estEnCours(LocalDate dateReference) {
        return !dateDebut.isAfter(dateReference) && !dateFin.isBefore(dateReference);
    }
}