package com.backend.ai;

import com.backend.modele.Candidature;
import org.springframework.stereotype.Component;

@Component
public class CandidatureContextBuilder implements EntityContextBuilder<Candidature> {
    @Override public String build(Candidature c) {
        return "{" +
                "\n  \"type\": \"candidature\"," +
                "\n  \"id\": " + c.getId() + ',' +
                (c.getOffre()!=null?"\n  \"offreId\": " + c.getOffre().getId() + ',':"") +
                (c.getEtudiant()!=null?"\n  \"etudiantId\": " + c.getEtudiant().getId() + ',':"") +
                (c.getDateCandidature()!=null?"\n  \"dateCandidature\": \""+ c.getDateCandidature() +"\",":"") +
                (c.getStatut()!=null?"\n  \"statut\": \""+ c.getStatut().name() +"\",":"") +
                (c.getMessageReponse()!=null?"\n  \"messageReponse\": \""+ RedactionUtil.escape(RedactionUtil.sanitize(c.getMessageReponse())) +"\",":"") +
                (c.getConvocationEntrevue()!=null?"\n  \"convocationId\": " + c.getConvocationEntrevue().getId() + ',':"") +
                "\n}";
    }
    @Override public String getType() { return "candidatures"; }
}

