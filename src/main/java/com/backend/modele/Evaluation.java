package com.backend.modele;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Evaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private EntenteStage entente;

    @ManyToOne
    private Etudiant etudiant;

    @ManyToOne
    private Employeur employeur;

    @Column(length = 1000000) // Ajustez la taille si nécessaire (1MB ici)
    private String pdfBase64;

    private LocalDateTime dateEvaluation = LocalDateTime.now();

}