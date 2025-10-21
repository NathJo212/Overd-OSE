package com.backend.util;

import com.backend.modele.EntenteStage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

public class EntentePdfGenerator {

    public static byte[] generatePdfBytes(EntenteStage entente) throws IOException {
        if (entente == null) throw new IllegalArgumentException("Entente null");

        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.LETTER);
            doc.addPage(page);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                cs.setLeading(14.5f);
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 16);
                cs.newLineAtOffset(50, 700);
                cs.showText("Entente de stage");
                cs.newLine();
                cs.newLine();

                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA),12);
                String etudiant = entente.getEtudiant() != null ? entente.getEtudiant().getPrenom() + " " + entente.getEtudiant().getNom() : "-";
                String employeur = entente.getEmployeur() != null ? entente.getEmployeur().getContact() : "-";
                String offre = entente.getOffre() != null ? entente.getOffre().getTitre() : "-";

                cs.showText("Etudiant: " + etudiant);
                cs.newLine();
                cs.showText("Employeur: " + employeur);
                cs.newLine();
                cs.showText("Offre: " + offre);
                cs.newLine();
                cs.newLine();

                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD),13);
                cs.showText("Titre: ");
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                cs.showText(entente.getTitre() != null ? entente.getTitre() : "-");
                cs.newLine();

                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 13);
                cs.showText("Description: ");
                cs.newLine();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);

                String desc = entente.getDescription() != null ? entente.getDescription() : "-";
                printWrapped(cs, desc, 80);
                cs.newLine();

                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 13);
                cs.showText("Dates: ");
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                String dates = (entente.getDateDebut() != null ? entente.getDateDebut().toString() : "-") + " - " + (entente.getDateFin() != null ? entente.getDateFin().toString() : "-");
                cs.showText(dates);
                cs.newLine();

                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 13);
                cs.showText("Horaire: ");
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                cs.showText(entente.getHoraire() != null ? entente.getHoraire() : "-");
                cs.newLine();

                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 13);
                cs.showText("Durée hebdomadaire: ");
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                cs.showText(entente.getDureeHebdomadaire() != null ? entente.getDureeHebdomadaire().toString() + " heures" : "-");
                cs.newLine();

                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 13);
                cs.showText("Rémunération: ");
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                cs.showText(entente.getRemuneration() != null ? entente.getRemuneration() : "-");
                cs.newLine();
                cs.newLine();

                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 13);
                cs.showText("Responsabilités: ");
                cs.newLine();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                printWrapped(cs, entente.getResponsabilites() != null ? entente.getResponsabilites() : "-", 80);
                cs.newLine();

                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 13);
                cs.showText("Objectifs: ");
                cs.newLine();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                printWrapped(cs, entente.getObjectifs() != null ? entente.getObjectifs() : "-", 80);
                cs.newLine();

                cs.endText();
            }

            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                doc.save(baos);
                return baos.toByteArray();
            }
        }
    }

    private static void printWrapped(PDPageContentStream cs, String text, int maxCharsPerLine) throws IOException {
        if (text == null) return;
        String[] words = text.split("\\s+");
        StringBuilder line = new StringBuilder();
        for (String w : words) {
            if (line.length() + w.length() + 1 > maxCharsPerLine) {
                cs.showText(line.toString());
                cs.newLine();
                line = new StringBuilder();
            }
            if (line.length() > 0) line.append(' ');
            line.append(w);
        }
        if (line.length() > 0) {
            cs.showText(line.toString());
        }
    }
}
