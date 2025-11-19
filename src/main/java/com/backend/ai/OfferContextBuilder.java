package com.backend.ai;

import com.backend.modele.Offre;
import org.springframework.stereotype.Component;
import java.time.format.DateTimeFormatter;

@Component
public class OfferContextBuilder implements EntityContextBuilder<Offre> {
    private static final int MAX_DESC = 800;
    @Override public String build(Offre o) {
        DateTimeFormatter fmt = DateTimeFormatter.ISO_DATE;
        String desc = o.getDescription();
        if (desc != null && desc.length() > MAX_DESC) desc = desc.substring(0, MAX_DESC) + "...";
        return "{" +
                "\n  \"type\": \"offre\"," +
                "\n  \"id\": " + o.getId() + ',' +
                (o.getTitre()!=null?"\n  \"titre\": \""+ RedactionUtil.escape(o.getTitre()) +"\",":"") +
                (desc!=null?"\n  \"description\": \""+ RedactionUtil.escape(desc) +"\",":"") +
                (o.getDate_debut()!=null?"\n  \"date_debut\": \""+ o.getDate_debut().format(fmt) +"\",":"") +
                (o.getDate_fin()!=null?"\n  \"date_fin\": \""+ o.getDate_fin().format(fmt) +"\",":"") +
                (o.getProgEtude()!=null?"\n  \"programme\": \""+ o.getProgEtude().name() +"\",":"") +
                (o.getLieuStage()!=null?"\n  \"lieuStage\": \""+ RedactionUtil.escape(o.getLieuStage()) +"\",":"") +
                (o.getRemuneration()!=null?"\n  \"remuneration\": \""+ RedactionUtil.escape(o.getRemuneration()) +"\",":"") +
                (o.getDateLimite()!=null?"\n  \"dateLimite\": \""+ o.getDateLimite().format(fmt) +"\",":"") +
                (o.getHoraire()!=null?"\n  \"horaire\": \""+ RedactionUtil.escape(o.getHoraire()) +"\",":"") +
                (o.getDureeHebdomadaire()!=null?"\n  \"dureeHebdomadaire\": " + o.getDureeHebdomadaire() + ',':"") +
                (o.getObjectifs()!=null?"\n  \"objectifs\": \""+ RedactionUtil.escape(RedactionUtil.truncate(o.getObjectifs())) +"\",":"") +
                (o.getStatutApprouve()!=null?"\n  \"statutApprouve\": \""+ o.getStatutApprouve().name() +"\",":"") +
                "\n}";
    }
    @Override public String getType() { return "offres"; }
}

