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
public class EvaluationMilieuStageParProfesseur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "entente_id")
    private EntenteStage entente;

    @ManyToOne
    @JoinColumn(name = "professeur_id")
    private Professeur professeur;

    @ManyToOne
    @JoinColumn(name = "employeur_id")
    private Employeur employeur;

    @ManyToOne
    @JoinColumn(name = "etudiant_id")
    private Etudiant etudiant;

    // Critères d'évaluation (texte libre pour commentaires détaillés)
    @Column(length = 4000)
    private String qualiteEncadrement;

    @Column(length = 4000)
    private String pertinenceMissions;

    @Column(length = 4000)
    private String respectHorairesConditions;

    @Column(length = 4000)
    private String communicationDisponibilite;

    @Column(length = 4000)
    private String commentairesAmelioration;

    @Column(length = 1000000) // PDF généré à partir des données (optionnel)
    private String pdfBase64;

    private LocalDateTime dateEvaluation = LocalDateTime.now();

}
