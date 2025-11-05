package com.backend.util;

import com.backend.modele.EntenteStage;
import com.backend.modele.Employeur;
import com.backend.modele.Etudiant;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.AcroFields;
import com.itextpdf.text.pdf.BaseFont;
import com.itextpdf.text.pdf.PdfContentByte;
import com.itextpdf.text.pdf.PdfName;
import com.itextpdf.text.pdf.PdfReader;
import com.itextpdf.text.pdf.PdfStamper;
import com.itextpdf.text.pdf.parser.ImageRenderInfo;
import com.itextpdf.text.pdf.parser.LineSegment;
import com.itextpdf.text.pdf.parser.PdfContentStreamProcessor;
import com.itextpdf.text.pdf.parser.RenderListener;
import com.itextpdf.text.pdf.parser.TextRenderInfo;
import com.itextpdf.text.pdf.ColumnText;
import com.itextpdf.text.Font;
import com.itextpdf.text.Phrase;

import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.time.temporal.ChronoUnit;
import java.util.*;

public class CreateEntenteForm {

    public static byte[] generatePdfBytes(EntenteStage entente, String gestionnaireNom) throws IOException {
        if (entente == null) throw new IllegalArgumentException("Entente null");

        try (InputStream is = CreateEntenteForm.class.getResourceAsStream("/documents/ContratEntente.pdf")) {
            if (is == null) throw new FileNotFoundException("Template ContratEntente.pdf introuvable");

            PdfReader reader = new PdfReader(is);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try {
                PdfStamper stamper = new PdfStamper(reader, baos);

                String nomGestionnaire = safe(gestionnaireNom);
                Employeur emp = entente.getEmployeur();
                String nomEmployeur = emp != null ? safe(emp.getNomEntreprise()) : "-";
                Etudiant etu = entente.getEtudiant();
                String nomEtudiant = etu != null ? safe(etu.getPrenom()) + " " + safe(etu.getNom()) : "-";
                String lieu = safe(entente.getLieu());
                String taux = safe(entente.getRemuneration());
                String description = safe(entente.getDescription());
                String dateDebut = entente.getDateDebut() != null ? entente.getDateDebut().toString() : "-";
                String dateFin = entente.getDateFin() != null ? entente.getDateFin().toString() : "-";
                long semaines = 0;
                if (entente.getDateDebut() != null && entente.getDateFin() != null) {
                    semaines = ChronoUnit.WEEKS.between(entente.getDateDebut(), entente.getDateFin());
                    if (semaines < 0) semaines = 0;
                }
                String horaire = safe(entente.getHoraire());
                String heuresSemaine = entente.getDureeHebdomadaire() != null ? String.valueOf(entente.getDureeHebdomadaire()) : "-";
                String dateSignEtu = entente.getDateSignatureEtudiant() != null ? entente.getDateSignatureEtudiant().toString() : "-";
                String dateSignEmp = entente.getDateSignatureEmployeur() != null ? entente.getDateSignatureEmployeur().toString() : "-";
                String dateSignGest = entente.getDateSignatureGestionnaire() != null ? entente.getDateSignatureGestionnaire().toString() : "-";

                String respEtu = safe(entente.getResponsabilitesEtudiant());
                String respEmp = safe(entente.getResponsabilitesEmployeur());
                String respCol = safe(entente.getResponsabilitesCollege());

                Map<String, String> replacements = new LinkedHashMap<>();
                replacements.put("[xx]", "");
                replacements.put("[nom_gestionnaire]", nomGestionnaire);
                replacements.put("[nom_employeur]", nomEmployeur);
                replacements.put("[nom_etudiant]", nomEtudiant);
                replacements.put("[offre_lieuStage]", lieu);
                replacements.put("[offre_tauxHoraire]", taux);
                replacements.put("[offre_description]", description);
                replacements.put("[dateDebut]", dateDebut);
                replacements.put("[dateFin]", dateFin);
                replacements.put("[semaines]", String.valueOf(semaines));
                replacements.put("[horaire]", horaire);
                replacements.put("[heures_semaine]", heuresSemaine);
                replacements.put("[date_signature_etudiant]", dateSignEtu);
                replacements.put("[date_signature_employeur]", dateSignEmp);
                replacements.put("[date_signature_gestionnaire]", dateSignGest);

                try {
                    AcroFields form = stamper.getAcroFields();
                    if (form != null) {
                        setIfPresent(form, "nom_gestionnaire", nomGestionnaire);
                        setIfPresent(form, "nom_employeur", nomEmployeur);
                        setIfPresent(form, "nom_etudiant", nomEtudiant);
                        setIfPresent(form, "offre_lieuStage", lieu);
                        setIfPresent(form, "offre_tauxHoraire", taux);
                        setIfPresent(form, "offre_description", description);
                        setIfPresent(form, "dateDebut", dateDebut);
                        setIfPresent(form, "dateFin", dateFin);
                        setIfPresent(form, "semaines", String.valueOf(semaines));
                        setIfPresent(form, "horaire", horaire);
                        setIfPresent(form, "heures_semaine", heuresSemaine);
                        setIfPresent(form, "date_signature_etudiant", dateSignEtu);
                        setIfPresent(form, "date_signature_employeur", dateSignEmp);
                        setIfPresent(form, "date_signature_gestionnaire", dateSignGest);
                    }
                } catch (Exception ignore) {
                }

                BaseFont baseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.EMBEDDED);
                int pages = reader.getNumberOfPages();

                for (int page = 1; page <= pages; page++) {
                    LinkedHashSet<String> tokens = new LinkedHashSet<>(replacements.keySet());
                    final String NBSP = "\u00A0";
                   tokens.add("xx");
                    tokens.add("xxh");

                    tokens.add("Date de début");
                    tokens.add("Date de début :");
                    tokens.add("Date de début" + NBSP + ":");
                    tokens.add("Date de fin");
                    tokens.add("Date de fin :");
                    tokens.add("Date de fin" + NBSP + ":");
                    tokens.add("Nombre total de semaines");
                    tokens.add("Nombre total de semaines :");
                    tokens.add("Nombre total de semaines" + NBSP + ":");
                    tokens.add("Horaire de travail");
                    tokens.add("Horaire de travail :");
                    tokens.add("Horaire de travail" + NBSP + ":");
                    tokens.add("Nombre total d'heures par semaine");
                    tokens.add("Nombre total d'heures par semaine :");
                    tokens.add("Nombre total d'heures par semaine" + NBSP + ":");
                    tokens.add("Nombre total d’heures par semaine");
                    tokens.add("Nombre total d’heures par semaine :");
                    tokens.add("Nombre total d’heures par semaine" + NBSP + ":");

                    // Collège
                    tokens.add("Le Collège s'engage à");
                    tokens.add("Le Collège s'engage à :");
                    tokens.add("Le Collège s'engage à" + NBSP + ":");
                    tokens.add("Le Collège s’engage à");
                    tokens.add("Le Collège s’engage à :");
                    tokens.add("Le Collège s’engage à" + NBSP + ":");

                    tokens.add("Le Collège s'engage :");
                    tokens.add("Le Collège s’engage :");
                    tokens.add("Le Collège s'engage" + NBSP + ":");
                    tokens.add("Le Collège s’engage" + NBSP + ":");

                    // Entreprise/Employeur
                    tokens.add("L'entreprise s'engage à");
                    tokens.add("L'entreprise s'engage à :");
                    tokens.add("L'entreprise s'engage à" + NBSP + ":");
                    tokens.add("L’entreprise s’engage à");
                    tokens.add("L’entreprise s’engage à :");
                    tokens.add("L’entreprise s’engage à" + NBSP + ":");
                    tokens.add("L'employeur s'engage à");
                    tokens.add("L'employeur s'engage à :");
                    tokens.add("L'employeur s'engage à" + NBSP + ":");
                    tokens.add("L’employeur s’engage à");
                    tokens.add("L’employeur s’engage à :");
                    tokens.add("L’employeur s’engage à" + NBSP + ":");

                    tokens.add("L'entreprise s'engage :");
                    tokens.add("L’entreprise s’engage :");
                    tokens.add("L'entreprise s'engage" + NBSP + ":");
                    tokens.add("L’entreprise s’engage" + NBSP + ":");
                    tokens.add("L'employeur s'engage :");
                    tokens.add("L’employeur s’engage :");
                    tokens.add("L'employeur s'engage" + NBSP + ":");
                    tokens.add("L’employeur s’engage" + NBSP + ":");

                    // Étudiant
                    tokens.add("L'étudiant s'engage à");
                    tokens.add("L'étudiant s'engage à :");
                    tokens.add("L'étudiant s'engage à" + NBSP + ":");
                    tokens.add("L’étudiant s’engage à");
                    tokens.add("L’étudiant s’engage à :");
                    tokens.add("L’étudiant s’engage à" + NBSP + ":");

                    tokens.add("L'étudiant s'engage :");
                    tokens.add("L’étudiant s’engage :");
                    tokens.add("L'étudiant s'engage" + NBSP + ":");
                    tokens.add("L’étudiant s’engage" + NBSP + ":");

                    PlaceholderCollector collector = new PlaceholderCollector(tokens);
                    Rectangle pageSize = reader.getPageSize(page);
                    float pageRight = pageSize.getRight();
                    float pageLeftMargin = 36f;
                    float pageRightMargin = pageRight - 36f;
                    PdfContentStreamProcessor processor = new PdfContentStreamProcessor(collector);
                    processor.processContent(reader.getPageContent(page), reader.getPageN(page).getAsDict(PdfName.RESOURCES));
                    collector.finalizePage();

                    collector.found.sort(Comparator.comparingInt(f -> f.startIndex));
                    if (collector.found.isEmpty()) continue;

                    PdfContentByte over = stamper.getOverContent(page);
                    for (Found f : collector.found) {
                        String token = f.token;
                        if (!"xx".equals(token) && !"xxh".equals(token)) continue;
                        String ctx = getContextBefore(collector, f.startIndex, 120).toLowerCase(Locale.ROOT);
                        if (ctx.contains("date de début") || ctx.contains("date de fin") || ctx.contains("nombre total de semaines") || ctx.contains("horaire de travail") || ctx.contains("nombre total d'heures par semaine") || ctx.contains("nombre total d’heures par semaine")) {
                            Rectangle rr = f.rect;
                            float pad = 1.0f;
                            over.saveState();
                            over.setRGBColorFill(255, 255, 255);
                            over.rectangle(rr.getLeft() - pad, rr.getBottom() - pad, rr.getWidth() + 2 * pad, rr.getHeight() + 2 * pad);
                            over.fill();
                            over.restoreState();
                        }
                    }

                    List<Found> respLabels = new ArrayList<>();
                    for (Found lf : collector.found) {
                        String t = lf.token.toLowerCase(Locale.ROOT);
                        if ((t.contains("s'engage") || t.contains("s’engage")) &&
                                (t.contains("collège") || t.contains("entreprise") || t.contains("employeur") || t.contains("étudiant"))) {
                            respLabels.add(lf);
                        }
                    }
                    respLabels.sort((a, b) -> Float.compare(b.rect.getBottom(), a.rect.getBottom()));

                   for (Found f : collector.found) {
                        String token = f.token;
                        String value = replacements.get(token);
                        Rectangle r = f.rect;

                        if ("xx".equals(token) || "xxh".equals(token)) continue;

                        if ("[offre_description]".equals(token)) {
                            float left = r.getLeft();
                            float bottom = r.getBottom();
                            float right = Math.min(left + 440f, pageRightMargin);
                            float top = bottom + 120f;
                            over.saveState();
                            over.setRGBColorFill(255, 255, 255);
                            over.rectangle(left - 1.5f, bottom - 1.5f, (right - left) + 3f, (top - bottom) + 3f);
                            over.fill();
                            over.restoreState();

                            ColumnText ct = new ColumnText(over);
                            ct.setSimpleColumn(left, bottom, right, top);
                            Font font = new Font(baseFont, 11f);
                            ct.setLeading(14f);
                            ct.addText(new Phrase(description, font));
                            ct.go();
                            continue;
                        }

                        if ((token.contains("s'engage") || token.contains("s’engage")) &&
                                (token.contains("Collège") || token.contains("collège") || token.contains("entreprise") || token.contains("employeur") || token.contains("étudiant") || token.contains("Étudiant") )) {
                            String lower = token.toLowerCase(Locale.ROOT);
                            String respVal = lower.contains("collège") ? respCol : (lower.contains("entreprise") || lower.contains("employeur")) ? respEmp : respEtu;

                           float sectionTop = r.getBottom() - 6f; // a bit below the label
                            float desiredHeight = 170f;
                            float sectionBottomCandidate = sectionTop - desiredHeight;

                            float barrier = 36f;
                            float currentY = r.getBottom();
                            float nearestBelowTop = -1f;
                            for (Found rf : respLabels) {
                                if (rf.rect.getBottom() < currentY) {
                                    // label below; choose nearest (highest bottom among those below)
                                    if (nearestBelowTop < 0 || rf.rect.getTop() > nearestBelowTop) {
                                        nearestBelowTop = rf.rect.getTop();
                                    }
                                }
                            }
                            if (nearestBelowTop > 0) {
                                barrier = nearestBelowTop + 6f;
                            }

                            float sectionBottom = Math.max(sectionBottomCandidate, barrier);
                            if (sectionBottom >= sectionTop - 8f) {
                                sectionBottom = sectionTop - 40f;
                            }

                            float left = Math.max(r.getLeft(), pageLeftMargin + 36f);
                            float right = pageRightMargin;

                            over.saveState();
                            over.setRGBColorFill(255, 255, 255);
                            over.rectangle(left - 1.5f, sectionBottom - 1.5f, (right - left) + 3f, (sectionTop - sectionBottom) + 3f);
                            over.fill();
                            over.restoreState();

                            ColumnText ct = new ColumnText(over);
                            ct.setSimpleColumn(left, sectionBottom, right, sectionTop);
                            Font font = new Font(baseFont, 11f);
                            ct.setLeading(14f);
                            ct.addText(new Phrase(respVal, font));
                            ct.go();
                            continue;
                        }

                        if (equalsAny(token,
                                "Date de début", "Date de début :", "Date de début" + NBSP + ":",
                                "Date de fin", "Date de fin :", "Date de fin" + NBSP + ":",
                                "Nombre total de semaines", "Nombre total de semaines :", "Nombre total de semaines" + NBSP + ":",
                                "Horaire de travail", "Horaire de travail :", "Horaire de travail" + NBSP + ":",
                                "Nombre total d'heures par semaine", "Nombre total d'heures par semaine :", "Nombre total d'heures par semaine" + NBSP + ":",
                                "Nombre total d’heures par semaine", "Nombre total d’heures par semaine :", "Nombre total d’heures par semaine" + NBSP + ":")) {
                           String norm = token.toLowerCase(Locale.ROOT)
                                    .replace('\u00A0', ' ')
                                    .replace(" :", "")
                                    .trim();
                            String textToWrite;
                            if (norm.startsWith("date de début")) textToWrite = dateDebut;
                            else if (norm.startsWith("date de fin")) textToWrite = dateFin;
                            else if (norm.startsWith("nombre total de semaines")) textToWrite = String.valueOf(semaines);
                            else if (norm.startsWith("horaire de travail")) textToWrite = horaire;
                            else if (norm.contains("heures par semaine")) textToWrite = "-".equals(heuresSemaine) ? "-" : (heuresSemaine + "h");
                            else textToWrite = "";

                            float left = Math.max(r.getRight() + 6f, pageLeftMargin + 160f);
                            float y = r.getBottom();
                            float width = Math.max(180f, pageRightMargin - left);
                            float fontSize = 11f;
                            float textWidth = baseFont.getWidthPoint(textToWrite, fontSize);
                            if (textWidth > width) {
                                fontSize = Math.max(10f, fontSize * (width / textWidth));
                            }
                            over.beginText();
                            over.setFontAndSize(baseFont, fontSize);
                            over.setRGBColorFill(0, 0, 0);
                            over.setTextMatrix(left, y);
                            over.showText(textToWrite);
                            over.endText();
                            continue;
                        }

                       if (value != null) {
                            float minFont = 10f;
                            float pad = 1.5f;
                            float minWidth = 140f;
                            float width = Math.max(r.getWidth() + 3f, minWidth);
                            float height = Math.max(r.getHeight() + 3f, 14f);
                            float left = r.getLeft() - pad;
                            float bottom = r.getBottom() - pad;

                            over.saveState();
                            over.setRGBColorFill(255, 255, 255);
                            over.rectangle(left, bottom, width, height);
                            over.fill();
                            over.restoreState();

                            float fontSize = Math.max(minFont, r.getHeight() * 0.9f);
                            float textWidth = baseFont.getWidthPoint(value, fontSize);
                            if (textWidth > width) {
                                fontSize = Math.max(minFont, fontSize * (width / textWidth));
                            }
                            over.beginText();
                            over.setFontAndSize(baseFont, fontSize);
                            over.setRGBColorFill(0, 0, 0);
                            over.setTextMatrix(r.getLeft(), r.getBottom());
                            over.showText(value);
                            over.endText();
                        }
                    }
                }

                stamper.setFormFlattening(true);
                stamper.close();
                reader.close();
                return baos.toByteArray();
            } catch (DocumentException de) {
                throw new IOException("Erreur iText", de);
            } finally {
                baos.close();
            }
        }
    }

    private static void setIfPresent(AcroFields form, String name, String value) throws IOException, DocumentException {
        if (form.getField(name) != null) {
            form.setField(name, value != null ? value : "-");
        }
    }

    private static String safe(String v) { return (v == null || v.isBlank()) ? "-" : v; }

    private static boolean equalsAny(String token, String... values) {
        for (String v : values) if (token.equals(v)) return true; return false;
    }

    private static class Found {
        final String token; final Rectangle rect; final int startIndex;
        Found(String token, Rectangle rect, int startIndex) { this.token = token; this.rect = rect; this.startIndex = startIndex; }
    }

    private static class PlaceholderCollector implements RenderListener {
        private final Set<String> tokens;
        private final StringBuilder text = new StringBuilder();
        private final List<CharPos> chars = new ArrayList<>();
        final List<Found> found = new ArrayList<>();

        PlaceholderCollector(Set<String> tokens) { this.tokens = tokens; }
        @Override public void beginTextBlock() {}
        @Override public void endTextBlock() {}
        @Override public void renderImage(ImageRenderInfo renderInfo) {}

        @Override
        public void renderText(TextRenderInfo renderInfo) {
            for (TextRenderInfo cri : renderInfo.getCharacterRenderInfos()) {
                String s = cri.getText();
                if (s == null || s.isEmpty()) continue;
                Rectangle rect = rectFrom(cri);
                text.append(s);
                for (int i = 0; i < s.length(); i++) {
                    chars.add(new CharPos(rect));
                }
            }
        }

        private Rectangle rectFrom(TextRenderInfo info) {
            LineSegment ascent = info.getAscentLine();
            LineSegment descent = info.getDescentLine();
            com.itextpdf.text.pdf.parser.Vector a0 = ascent.getStartPoint();
            com.itextpdf.text.pdf.parser.Vector a1 = ascent.getEndPoint();
            com.itextpdf.text.pdf.parser.Vector d0 = descent.getStartPoint();
            com.itextpdf.text.pdf.parser.Vector d1 = descent.getEndPoint();
            float minX = Math.min(Math.min(a0.get(0), a1.get(0)), Math.min(d0.get(0), d1.get(0)));
            float maxX = Math.max(Math.max(a0.get(0), a1.get(0)), Math.max(d0.get(0), d1.get(0)));
            float minY = Math.min(Math.min(a0.get(1), a1.get(1)), Math.min(d0.get(1), d1.get(1)));
            float maxY = Math.max(Math.max(a0.get(1), a1.get(1)), Math.max(d0.get(1), d1.get(1)));
            return new Rectangle(minX, minY, maxX, maxY);
        }

        public void finalizePage() {
            String full = text.toString();
            for (String token : tokens) {
                int idx = full.indexOf(token);
                while (idx >= 0) {
                    int start = idx;
                    int end = idx + token.length();
                    if (end <= chars.size()) {
                        float minX = Float.MAX_VALUE, minY = Float.MAX_VALUE, maxX = 0, maxY = 0;
                        for (int i = start; i < end; i++) {
                            Rectangle r = chars.get(i).rect;
                            if (r == null) continue;
                            minX = Math.min(minX, r.getLeft());
                            minY = Math.min(minY, r.getBottom());
                            maxX = Math.max(maxX, r.getRight());
                            maxY = Math.max(maxY, r.getTop());
                        }
                        if (minX < Float.MAX_VALUE) {
                            found.add(new Found(token, new Rectangle(minX, minY, maxX, maxY), start));
                        }
                    }
                    idx = full.indexOf(token, idx + token.length());
                }
            }
        }

        public String getContextBefore(int index, int size) {
            String full = text.toString();
            int start = Math.max(0, index - size);
            return full.substring(start, index);
        }

        private static class CharPos {
            final Rectangle rect;
            CharPos(Rectangle rect) { this.rect = rect; }
        }
    }

    private static String getContextBefore(PlaceholderCollector collector, int index, int size) {
        return collector != null ? collector.getContextBefore(index, size) : "";
    }
}
