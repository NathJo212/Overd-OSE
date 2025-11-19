package com.backend.ai;

import com.backend.modele.EvaluationMilieuStage;
import org.springframework.stereotype.Component;

@Component
public class EvalMilieuContextBuilder implements EntityContextBuilder<EvaluationMilieuStage> {
    @Override public String build(EvaluationMilieuStage ev) {
        return "{" +
                "\n  \"type\": \"evaluationMilieu\"," +
                "\n  \"id\": " + ev.getId() + ',' +
                (ev.getDateEvaluation()!=null?"\n  \"dateEvaluation\": \""+ ev.getDateEvaluation() +"\",":"") +
                (ev.getEntente()!=null?"\n  \"ententeId\": " + ev.getEntente().getId() + ',':"") +
                (ev.getProfesseur()!=null?"\n  \"professeurId\": " + ev.getProfesseur().getId() + ',':"") +
                (ev.getEmployeur()!=null?"\n  \"employeurId\": " + ev.getEmployeur().getId() + ',':"") +
                (ev.getEtudiant()!=null?"\n  \"etudiantId\": " + ev.getEtudiant().getId() + ',':"") +
                "\n}"; // pdf omitted
    }
    @Override public String getType() { return "evaluationsMilieu"; }
}

