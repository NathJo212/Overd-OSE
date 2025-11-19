package com.backend.ai;

import com.backend.modele.EntenteStage;
import org.springframework.stereotype.Component;
import java.time.format.DateTimeFormatter;

@Component
public class EntenteContextBuilder implements EntityContextBuilder<EntenteStage> {
    @Override public String build(EntenteStage e) {
        DateTimeFormatter fmt = DateTimeFormatter.ISO_DATE;
        return "{" +
                "\n  \"type\": \"entente\"," +
                "\n  \"id\": " + e.getId() + ',' +
                (e.getTitre()!=null?"\n  \"titre\": \""+ RedactionUtil.escape(e.getTitre()) +"\",":"") +
                (e.getDescription()!=null?"\n  \"description\": \""+ RedactionUtil.escape(RedactionUtil.truncate(e.getDescription())) +"\",":"") +
                (e.getDateDebut()!=null?"\n  \"dateDebut\": \""+ e.getDateDebut().format(fmt) +"\",":"") +
                (e.getDateFin()!=null?"\n  \"dateFin\": \""+ e.getDateFin().format(fmt) +"\",":"") +
                (e.getRemuneration()!=null?"\n  \"remuneration\": \""+ RedactionUtil.escape(e.getRemuneration()) +"\",":"") +
                (e.getHoraire()!=null?"\n  \"horaire\": \""+ RedactionUtil.escape(e.getHoraire()) +"\",":"") +
                (e.getDureeHebdomadaire()!=null?"\n  \"dureeHebdomadaire\": " + e.getDureeHebdomadaire() + ',':"") +
                (e.getObjectifs()!=null?"\n  \"objectifs\": \""+ RedactionUtil.escape(RedactionUtil.truncate(e.getObjectifs())) +"\",":"") +
                (e.getProgEtude()!=null?"\n  \"programme\": \""+ e.getProgEtude().name() +"\",":"") +
                (e.getLieu()!=null?"\n  \"lieu\": \""+ RedactionUtil.escape(e.getLieu()) +"\",":"") +
                "\n  \"signatures\": {" +
                "\n    \"etudiant\": \"" + e.getEtudiantSignature().name() + "\"," +
                "\n    \"employeur\": \"" + e.getEmployeurSignature().name() + "\"" +
                "\n  }," +
                "\n  \"statut\": \"" + e.getStatut().name() + "\"," +
                "\n  \"rattachements\": {" +
                (e.getOffre()!=null?"\n    \"offreId\": " + e.getOffre().getId() + ',':"") +
                (e.getEtudiant()!=null?"\n    \"etudiantId\": " + e.getEtudiant().getId() + ',':"") +
                (e.getEmployeur()!=null?"\n    \"employeurId\": " + e.getEmployeur().getId() + ',':"") +
                "\n  }" +
                "\n}";
    }
    @Override public String getType() { return "ententes"; }
}

