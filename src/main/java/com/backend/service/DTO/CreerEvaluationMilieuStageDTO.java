package com.backend.service.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.backend.service.DTO.EvaluationEnumsDTO.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreerEvaluationMilieuStageDTO {

    private Long id;
    private Long ententeId;
    private Long employeurId;

    // --- IDENTIFICATION DE L'ENTREPRISE (Page 1) ---
    private String nomEntreprise;
    private String personneContact;
    private String adresse;
    private String ville;
    private String codePostal;
    private String telephone;
    private String telecopieur;

    // --- IDENTIFICATION DU STAGIAIRE (Page 1) ---
    private String nomStagiaire;
    private String dateDuStage;
    private StageNumeroChoix stageNumero;

    // --- ÉVALUATION (Page 1 & 2) ---
    private NiveauAccordMilieuStage tachesConformes;
    private NiveauAccordMilieuStage mesuresAccueil;
    private NiveauAccordMilieuStage tempsEncadrementSuffisant;
    private String heuresPremierMois;
    private String heuresDeuxiemeMois;
    private String heuresTroisiemeMois;
    private NiveauAccordMilieuStage environnementSecurite;
    private NiveauAccordMilieuStage climatTravail;
    private NiveauAccordMilieuStage milieuAccessible;
    private NiveauAccordMilieuStage salaireInteressant;
    private String salaireMontantHeure;
    private NiveauAccordMilieuStage communicationSuperviseur;
    private NiveauAccordMilieuStage equipementAdequat;
    private NiveauAccordMilieuStage volumeTravailAcceptable;

    // --- COMMENTAIRES (Zone de texte Page 2) ---
    private String commentaires;

    // --- OBSERVATIONS GÉNÉRALES (Page 2) ---
    private StageNumeroChoix milieuAPrivilegier;
    private StagiairesNbChoix accueillirStagiairesNb;
    private OuiNonChoix desireAccueillirMemeStagiaire;
    private OuiNonChoix offreQuartsVariables;
    private String quartsADe;
    private String quartsAFin;
    private String quartsBDe;
    private String quartsBFin;
    private String quartsCDe;
    private String quartsCFin;
    private String dateSignature;
}