package com.backend.service.DTO;

public class EvaluationEnumsDTO {

    public enum StageNumeroChoix {
        STAGE_1,
        STAGE_2
    }

    public enum NiveauAccordMilieuStage {
        TOTALEMENT_EN_ACCORD,
        PLUTOT_EN_ACCORD,
        PLUTOT_DESACCORD,
        TOTALEMENT_DESACCORD,
        IMPOSSIBLE_DE_SE_PRONONCER
    }

    public enum OuiNonChoix {
        OUI,
        NON
    }

    public enum StagiairesNbChoix {
        UN_STAGIAIRE,
        DEUX_STAGIAIRES,
        TROIS_STAGIAIRES,
        PLUS_DE_TROIS
    }

    public enum StagiaireTypeChoix {
        PREMIER_STAGE,
        DEUXIEME
    }
}