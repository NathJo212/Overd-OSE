package com.backend.service.DTO;

import com.backend.modele.Evaluation;
import com.backend.modele.NiveauAccord;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EvaluationDTO {
    private Long id;
    private Long ententeId;
    private Long etudiantId;

    // Informations du superviseur
    private String nomSuperviseur;
    private String fonctionSuperviseur;
    private String telephoneSuperviseur;
    private String dateSignature;

    // 1. PRODUCTIVITÉ
    private NiveauAccord prodPlanifierOrganiser;
    private NiveauAccord prodComprendreDirectives;
    private NiveauAccord prodRythmeSoutenu;
    private NiveauAccord prodEtablirPriorites;
    private NiveauAccord prodRespectEcheanciers;
    private String commentairesProductivite;

    // 2. QUALITÉ DU TRAVAIL
    private NiveauAccord qualRespectMandats;
    private NiveauAccord qualAttentionDetails;
    private NiveauAccord qualVerifierTravail;
    private NiveauAccord qualRechercherPerfectionnement;
    private NiveauAccord qualAnalyseProblemes;
    private String commentairesQualiteTravail;

    // 3. QUALITÉS DES RELATIONS INTERPERSONNELLES
    private NiveauAccord relEtablirContacts;
    private NiveauAccord relContribuerEquipe;
    private NiveauAccord relAdapterCulture;
    private NiveauAccord relAccepterCritiques;
    private NiveauAccord relEtreRespectueux;
    private NiveauAccord relEcouteActive;
    private String commentairesRelations;

    // 4. HABILETÉS PERSONNELLES
    private NiveauAccord habInteretMotivation;
    private NiveauAccord habExprimerIdees;
    private NiveauAccord habFairePreuveInitiative;
    private NiveauAccord habTravaillerSecuritaire;
    private NiveauAccord habSensResponsabilites;
    private NiveauAccord habPonctuelAssidu;
    private String commentairesHabiletés;

    // APPRÉCIATION GLOBALE ET FINALISATION
    private String appreciationGlobale;
    private String precisionAppreciation;
    private Boolean discussionAvecStagiaire;
    private Integer heuresEncadrementSemaine;
    private String entrepriseAccueillirProchainStage;
    private Boolean formationTechniqueSuffisante;


    private String pdfBase64;
    private String dateEvaluation;

    public EvaluationDTO toDTO(Evaluation e) {
        EvaluationDTO dto = new EvaluationDTO();
        dto.setId(e.getId());
        dto.setEntenteId(e.getEntente() != null ? e.getEntente().getId() : null);
        dto.setEtudiantId(e.getEtudiant() != null ? e.getEtudiant().getId() : null);

        // Seuls les champs stockés sont mappés pour la réponse
        dto.setPdfBase64(e.getPdfBase64());
        dto.setDateEvaluation(e.getDateEvaluation() != null ? e.getDateEvaluation().toString() : null);

        return dto;
    }
}