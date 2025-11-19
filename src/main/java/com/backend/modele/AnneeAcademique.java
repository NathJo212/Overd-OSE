package com.backend.modele;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "annee_academique")
@Getter
@Setter
@NoArgsConstructor
public class AnneeAcademique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer anneeDebut;

    @Column(nullable = false)
    private Integer anneeFin;

    @Column(nullable = false)
    private LocalDate dateDebut;

    @Column(nullable = false)
    private LocalDate dateFin;

    public AnneeAcademique(Integer anneeDebut, Integer anneeFin, LocalDate dateDebut, LocalDate dateFin) {
        this.anneeDebut = anneeDebut;
        this.anneeFin = anneeFin;
        this.dateDebut = dateDebut;
        this.dateFin = dateFin;
    }

    /**
     * Retourne une représentation textuelle de l'année académique (ex: "2025-2026")
     */
    public String getLibelle() {
        return anneeDebut + "-" + anneeFin;
    }

    /**
     * Vérifie si une date donnée appartient à cette année académique
     */
    public boolean contientDate(LocalDate date) {
        return !date.isBefore(dateDebut) && !date.isAfter(dateFin);
    }

    /**
     * Vérifie si cette année académique est la courante (basé sur la date actuelle)
     */
    public boolean estCourante() {
        return contientDate(LocalDate.now());
    }

    /**
     * Vérifie si cette année académique est passée
     */
    public boolean estPassee() {
        return LocalDate.now().isAfter(dateFin);
    }

    /**
     * Vérifie si cette année académique est future
     */
    public boolean estFuture() {
        return LocalDate.now().isBefore(dateDebut);
    }
}

