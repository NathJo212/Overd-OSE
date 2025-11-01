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

    private String competencesTechniques;
    private String respectDelais;
    private String attitudeIntegration;

    @Column(length = 4000)
    private String commentaires;

    private LocalDateTime dateEvaluation = LocalDateTime.now();

    public Evaluation(EntenteStage entente, Etudiant etudiant, Employeur employeur, String competencesTechniques,
                      String respectDelais, String attitudeIntegration, String commentaires) {
        this.entente = entente;
        this.etudiant = etudiant;
        this.employeur = employeur;
        this.competencesTechniques = competencesTechniques;
        this.respectDelais = respectDelais;
        this.attitudeIntegration = attitudeIntegration;
        this.commentaires = commentaires;
        this.dateEvaluation = LocalDateTime.now();
    }
}
