package com.backend.service.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreerEvaluationMilieuStageDTO {

    private Long id;
    private Long ententeId;
    private Long professeurId;

    // Critères d'évaluation du milieu de stage (texte libre)
    private String qualiteEncadrement;
    private String pertinenceMissions;
    private String respectHorairesConditions;
    private String communicationDisponibilite;

    // Commentaires et suggestions
    private String commentairesAmelioration;
}
