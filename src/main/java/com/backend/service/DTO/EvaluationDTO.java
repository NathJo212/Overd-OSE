package com.backend.service.DTO;

import com.backend.modele.Evaluation;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationDTO {
    private Long id;
    private Long ententeId;
    private Long etudiantId;
    private Long employeurId;
    private String pdfBase64;
    private LocalDate dateEvaluation;

    public EvaluationDTO toDTO(Evaluation e) {
        EvaluationDTO dto = new EvaluationDTO();
        dto.setId(e.getId());
        dto.setEntenteId(e.getEntente() != null ? e.getEntente().getId() : null);
        dto.setEtudiantId(e.getEtudiant() != null ? e.getEtudiant().getId() : null);
        dto.setDateEvaluation(e.getDateEvaluation() != null ? LocalDate.from(e.getDateEvaluation()) : null);
        return dto;
    }
}
