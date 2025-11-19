package com.backend.ai;

import com.backend.modele.EvaluationEtudiantParEmployeur;
import org.springframework.stereotype.Component;

@Component
public class EvalEtudiantContextBuilder implements EntityContextBuilder<EvaluationEtudiantParEmployeur> {
    @Override public String build(EvaluationEtudiantParEmployeur ev) {
        return "{" +
                "\n  \"type\": \"evaluationEtudiant\"," +
                "\n  \"id\": " + ev.getId() + ',' +
                (ev.getDateEvaluation()!=null?"\n  \"dateEvaluation\": \""+ ev.getDateEvaluation() +"\",":"") +
                (ev.getEntente()!=null?"\n  \"ententeId\": " + ev.getEntente().getId() + ',':"") +
                (ev.getEtudiant()!=null?"\n  \"etudiantId\": " + ev.getEtudiant().getId() + ',':"") +
                (ev.getEmployeur()!=null?"\n  \"employeurId\": " + ev.getEmployeur().getId() + ',':"") +
                "\n}"; // pdf omitted
    }
    @Override public String getType() { return "evaluationsEtudiant"; }
}

