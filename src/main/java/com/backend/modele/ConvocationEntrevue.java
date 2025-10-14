package com.backend.modele;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "convocation_entrevue")
@Getter
@Setter
@NoArgsConstructor
public class ConvocationEntrevue {

    public enum StatutConvocation {
        CONVOQUEE,
        MODIFIE,
        ANNULEE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "candidature_id", nullable = false, unique = true)
    private Candidature candidature;
    private LocalDateTime dateHeure;
    private String lieuOuLien;
    private String message;

    @Enumerated(EnumType.STRING)
    private StatutConvocation statut;

    public ConvocationEntrevue(Candidature candidature, LocalDateTime dateHeure, String lieuOuLien, String message) {
        this.candidature = candidature;
        this.dateHeure = dateHeure;
        this.lieuOuLien = lieuOuLien;
        this.message = message;
        this.statut = StatutConvocation.CONVOQUEE;
    }
}
