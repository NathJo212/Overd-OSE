package com.backend.ai;

import com.backend.modele.EvaluationMilieuStageParProfesseur;
import org.springframework.stereotype.Component;

@Component
public class EvalMilieuContextBuilder implements EntityContextBuilder<EvaluationMilieuStageParProfesseur> {
    @Override public String build(EvaluationMilieuStageParProfesseur ev) {
        return "{" +
                "\n  \"type\": \"evaluationMilieu\"," +
                "\n  \"id\": " + ev.getId() + ',' +
                (ev.getDateEvaluation()!=null?"\n  \"dateEvaluation\": \""+ ev.getDateEvaluation() +"\",":"") +
                (ev.getEntente()!=null?"\n  \"ententeId\": " + ev.getEntente().getId() + ',':"") +
                (ev.getProfesseur()!=null?"\n  \"professeurId\": " + ev.getProfesseur().getId() + ',':"") +
                (ev.getEmployeur()!=null?"\n  \"employeurId\": " + ev.getEmployeur().getId() + ',':"") +
                (ev.getEtudiant()!=null?"\n  \"etudiantId\": " + ev.getEtudiant().getId() + ',':"") +
                (ev.getQualiteEncadrement()!=null?"\n  \"qualiteEncadrement\": \""+ RedactionUtil.escape(RedactionUtil.truncate(ev.getQualiteEncadrement())) +"\",":"") +
                (ev.getPertinenceMissions()!=null?"\n  \"pertinenceMissions\": \""+ RedactionUtil.escape(RedactionUtil.truncate(ev.getPertinenceMissions())) +"\",":"") +
                (ev.getRespectHorairesConditions()!=null?"\n  \"respectHorairesConditions\": \""+ RedactionUtil.escape(RedactionUtil.truncate(ev.getRespectHorairesConditions())) +"\",":"") +
                (ev.getCommunicationDisponibilite()!=null?"\n  \"communicationDisponibilite\": \""+ RedactionUtil.escape(RedactionUtil.truncate(ev.getCommunicationDisponibilite())) +"\",":"") +
                (ev.getCommentairesAmelioration()!=null?"\n  \"commentairesAmelioration\": \""+ RedactionUtil.escape(RedactionUtil.truncate(ev.getCommentairesAmelioration())) +"\",":"") +
                "\n}"; // pdf omitted
    }
    @Override public String getType() { return "evaluationsMilieu"; }
}

