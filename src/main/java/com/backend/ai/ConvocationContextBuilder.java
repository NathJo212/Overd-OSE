package com.backend.ai;

import com.backend.modele.ConvocationEntrevue;
import org.springframework.stereotype.Component;

@Component
public class ConvocationContextBuilder implements EntityContextBuilder<ConvocationEntrevue> {
    @Override public String build(ConvocationEntrevue cv) {
        return "{" +
                "\n  \"type\": \"convocation\"," +
                "\n  \"id\": " + cv.getId() + ',' +
                (cv.getDateHeure()!=null?"\n  \"dateHeure\": \""+ cv.getDateHeure() +"\",":"") +
                (cv.getLieuOuLien()!=null?"\n  \"lieuOuLien\": \""+ RedactionUtil.escape(cv.getLieuOuLien()) +"\",":"") +
                (cv.getMessage()!=null?"\n  \"message\": \""+ RedactionUtil.escape(RedactionUtil.sanitize(cv.getMessage())) +"\",":"") +
                (cv.getStatut()!=null?"\n  \"statut\": \""+ cv.getStatut().name() +"\",":"") +
                (cv.getCandidature()!=null?"\n  \"candidatureId\": " + cv.getCandidature().getId() + ',':"") +
                "\n}";
    }
    @Override public String getType() { return "convocations"; }
}

