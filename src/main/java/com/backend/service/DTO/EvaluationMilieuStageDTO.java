package com.backend.service.DTO;

import com.backend.modele.EvaluationMilieuStageParProfesseur;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationMilieuStageDTO {
    private Long id;
    private Long ententeId;
    private Long professeurId;
    private Long employeurId;
    private Long etudiantId;
    private String nomProfesseur;
    private String prenomProfesseur;
    private String nomEntreprise;
    private String nomEtudiant;
    private String prenomEtudiant;

    // Critères d'évaluation
    private String qualiteEncadrement;
    private String pertinenceMissions;
    private String respectHorairesConditions;
    private String communicationDisponibilite;
    private String commentairesAmelioration;

    private String pdfBase64;
    private LocalDateTime dateEvaluation;

    public EvaluationMilieuStageDTO toDTO(EvaluationMilieuStageParProfesseur e) {
        EvaluationMilieuStageDTO dto = new EvaluationMilieuStageDTO();
        dto.setId(e.getId());
        dto.setEntenteId(e.getEntente() != null ? e.getEntente().getId() : null);
        dto.setProfesseurId(e.getProfesseur() != null ? e.getProfesseur().getId() : null);
        dto.setEmployeurId(e.getEmployeur() != null ? e.getEmployeur().getId() : null);
        dto.setEtudiantId(e.getEtudiant() != null ? e.getEtudiant().getId() : null);

        if (e.getProfesseur() != null) {
            dto.setNomProfesseur(e.getProfesseur().getNom());
            dto.setPrenomProfesseur(e.getProfesseur().getPrenom());
        }

        if (e.getEmployeur() != null) {
            dto.setNomEntreprise(e.getEmployeur().getNomEntreprise());
        }

        if (e.getEtudiant() != null) {
            dto.setNomEtudiant(e.getEtudiant().getNom());
            dto.setPrenomEtudiant(e.getEtudiant().getPrenom());
        }

        dto.setQualiteEncadrement(e.getQualiteEncadrement());
        dto.setPertinenceMissions(e.getPertinenceMissions());
        dto.setRespectHorairesConditions(e.getRespectHorairesConditions());
        dto.setCommunicationDisponibilite(e.getCommunicationDisponibilite());
        dto.setCommentairesAmelioration(e.getCommentairesAmelioration());
        dto.setPdfBase64(e.getPdfBase64());
        dto.setDateEvaluation(e.getDateEvaluation());

        return dto;
    }
}
