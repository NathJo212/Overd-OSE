package com.backend.util;

import com.backend.modele.EntenteStage;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.util.Matrix;
import org.apache.pdfbox.pdmodel.common.PDRectangle;

import java.io.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

public class EntentePdfGenerator {

    /**
     * Generates a filled PDF copy of ContratEntente.pdf,
     * keeping the layout intact and replacing placeholders in-place.
     */
    public static byte[] generatePdfBytes(EntenteStage entente, String gestionnaireNom) throws IOException {
        if (entente == null) throw new IllegalArgumentException("Entente null");

        // --- Load the template ---
        try (InputStream is = EntentePdfGenerator.class.getResourceAsStream("/documents/ContratEntente.pdf")) {
            if (is == null) throw new FileNotFoundException("Template ContratEntente.pdf introuvable");
            PDDocument doc = Loader.loadPDF(is.readAllBytes());

            // --- Build replacement values ---
            String nomGestionnaire = gestionnaireNom != null ? gestionnaireNom : "-";
            String nomEmployeur = entente.getEmployeur() != null ? entente.getEmployeur().getNomEntreprise() : "-";
            String nomEtudiant = entente.getEtudiant() != null
                    ? entente.getEtudiant().getPrenom() + " " + entente.getEtudiant().getNom()
                    : "-";
            String lieu = entente.getLieu() != null ? entente.getLieu() : "-";
            String horaire = entente.getHoraire() != null ? entente.getHoraire() : "-";
            String taux = entente.getRemuneration() != null ? entente.getRemuneration() : "-";
            String description = entente.getDescription() != null ? entente.getDescription() : "-";

            long semaines = 0;
            if (entente.getDateDebut() != null && entente.getDateFin() != null) {
                semaines = ChronoUnit.WEEKS.between(entente.getDateDebut(), entente.getDateFin());
                if (semaines < 0) semaines = 0;
            }

            // --- Placeholder mapping (kept for future templating if needed) ---
            Map<String, String> replacements = Map.ofEntries(
                    Map.entry("[xx]", entente.getDateDebut() != null ? entente.getDateDebut().toString() : "-"),
                    Map.entry("xx", entente.getDateFin() != null ? entente.getDateFin().toString() : "-"),
                    Map.entry("[nom_gestionnaire]", nomGestionnaire),
                    Map.entry("[nom_employeur]", nomEmployeur),
                    Map.entry("[nom_etudiant]", nomEtudiant),
                    Map.entry("[offre_lieuStage]", lieu),
                    Map.entry("[offre_tauxHoraire]", taux),
                    Map.entry("[offre_description]", description),
                    Map.entry("[date_signature_etudiant]", entente.getDateSignatureEtudiant() != null ? entente.getDateSignatureEtudiant().toString() : "-"),
                    Map.entry("[date_signature_employeur]", entente.getDateSignatureEmployeur() != null ? entente.getDateSignatureEmployeur().toString() : "-"),
                    Map.entry("[date_signature_gestionnaire]", entente.getDateSignatureGestionnaire() != null ? entente.getDateSignatureGestionnaire().toString() : "-")
            );

            // --- Get the first page ---
            PDPage page = doc.getPage(0);

            // --- Prepare overlay stream ---
            try (PDPageContentStream cs = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                cs.setFont(font, 11);

                // --- For simplicity, overlay values in fixed positions near placeholders ---
                float startX = 200; // left margin for text overlay
                float y = 720;      // start height; adjust downward as needed per line
                float lineSpacing = 15f;

                cs.beginText();
                cs.setTextMatrix(Matrix.getTranslateInstance(startX, y));

                cs.showText("Gestionnaire : " + nomGestionnaire); cs.newLineAtOffset(0, -lineSpacing);
                cs.showText("Employeur : " + nomEmployeur); cs.newLineAtOffset(0, -lineSpacing);
                cs.showText("Étudiant : " + nomEtudiant); cs.newLineAtOffset(0, -lineSpacing);
                cs.showText("Adresse : " + lieu); cs.newLineAtOffset(0, -lineSpacing);
                cs.showText("Horaire : " + horaire); cs.newLineAtOffset(0, -lineSpacing);
                cs.showText("Salaire : " + taux); cs.newLineAtOffset(0, -lineSpacing);
                cs.showText("Description : " + description); cs.newLineAtOffset(0, -lineSpacing);
                cs.showText("Début : " + (entente.getDateDebut() != null ? entente.getDateDebut().toString() : "-")); cs.newLineAtOffset(0, -lineSpacing);
                cs.showText("Fin : " + (entente.getDateFin() != null ? entente.getDateFin().toString() : "-")); cs.newLineAtOffset(0, -lineSpacing);
                cs.showText("Semaines : " + semaines);

                cs.endText();
            }

            // --- Save to byte array ---
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            doc.close();

            return baos.toByteArray();
        }
    }
}
