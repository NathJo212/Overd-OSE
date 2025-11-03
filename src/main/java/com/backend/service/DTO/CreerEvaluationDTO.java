package com.backend.service.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreerEvaluationDTO {

    public enum entrepriseProchainStageChoix {
        OUI,
        NON,
        PEUT_ETRE
    }

    private Long id;
    private Long ententeId;
    private Long etudiantId;

    // Informations du superviseur
    private String nomSuperviseur;
    private String fonctionSuperviseur;
    private String telephoneSuperviseur;
    private LocalDate dateSignature;

    // 1. PRODUCTIVITÉ
    private NiveauAccordDTO prodPlanifierOrganiser;
    private NiveauAccordDTO prodComprendreDirectives;
    private NiveauAccordDTO prodRythmeSoutenu;
    private NiveauAccordDTO prodEtablirPriorites;
    private NiveauAccordDTO prodRespectEcheanciers;
    private String commentairesProductivite;

    // 2. QUALITÉ DU TRAVAIL
    private NiveauAccordDTO qualRespectMandats;
    private NiveauAccordDTO qualAttentionDetails;
    private NiveauAccordDTO qualVerifierTravail;
    private NiveauAccordDTO qualRechercherPerfectionnement;
    private NiveauAccordDTO qualAnalyseProblemes;
    private String commentairesQualiteTravail;

    // 3. QUALITÉS DES RELATIONS INTERPERSONNELLES
    private NiveauAccordDTO relEtablirContacts;
    private NiveauAccordDTO relContribuerEquipe;
    private NiveauAccordDTO relAdapterCulture;
    private NiveauAccordDTO relAccepterCritiques;
    private NiveauAccordDTO relEtreRespectueux;
    private NiveauAccordDTO relEcouteActive;
    private String commentairesRelations;

    // 4. HABILETÉS PERSONNELLES
    private NiveauAccordDTO habInteretMotivation;
    private NiveauAccordDTO habExprimerIdees;
    private NiveauAccordDTO habFairePreuveInitiative;
    private NiveauAccordDTO habTravaillerSecuritaire;
    private NiveauAccordDTO habSensResponsabilites;
    private NiveauAccordDTO habPonctuelAssidu;
    private String commentairesHabiletes;

    // APPRÉCIATION GLOBALE ET FINALISATION
    private String appreciationGlobale;
    private String precisionAppreciation;
    private Boolean discussionAvecStagiaire;
    private Integer heuresEncadrementSemaine;
    private entrepriseProchainStageChoix entrepriseAccueillirProchainStage;
    private String formationTechniqueSuffisante;
}