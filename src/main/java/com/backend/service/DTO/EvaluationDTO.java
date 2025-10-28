package com.backend.service.DTO;

import com.backend.modele.Evaluation;
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
    private String competencesTechniques;
    private String respectDelais;
    private String attitudeIntegration;
    private String commentaires;
    private String dateEvaluation;

    public EvaluationDTO toDTO(Evaluation e) {
        EvaluationDTO dto = new EvaluationDTO();
        dto.setId(e.getId());
        dto.setEntenteId(e.getEntente() != null ? e.getEntente().getId() : null);
        dto.setEtudiantId(e.getEtudiant() != null ? e.getEtudiant().getId() : null);
        dto.setCompetencesTechniques(e.getCompetencesTechniques());
        dto.setRespectDelais(e.getRespectDelais());
        dto.setAttitudeIntegration(e.getAttitudeIntegration());
        dto.setCommentaires(e.getCommentaires());
        dto.setDateEvaluation(e.getDateEvaluation() != null ? e.getDateEvaluation().toString() : null);
        return dto;
    }
}


