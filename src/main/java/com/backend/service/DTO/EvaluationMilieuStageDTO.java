package com.backend.service.DTO;

import com.backend.modele.EvaluationMilieuStage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationMilieuStageDTO {

    private Long id;
    private Long ententeId;
    private Long professeurId;
    private Long employeurId;
    private Long etudiantId;
    private String pdfBase64;
    private LocalDateTime dateEvaluation;

    // Méthode statique toDTO
    public static EvaluationMilieuStageDTO toDTO(EvaluationMilieuStage entity) {
        if (entity == null) {
            return null;
        }

        return EvaluationMilieuStageDTO.builder()
                .id(entity.getId())
                .ententeId(entity.getEntente() != null ? entity.getEntente().getId() : null)
                .professeurId(entity.getProfesseur() != null ? entity.getProfesseur().getId() : null)
                .employeurId(entity.getEmployeur() != null ? entity.getEmployeur().getId() : null)
                .etudiantId(entity.getEtudiant() != null ? entity.getEtudiant().getId() : null)
                .pdfBase64(entity.getPdfBase64())
                .dateEvaluation(entity.getDateEvaluation())
                .build();
    }
}
