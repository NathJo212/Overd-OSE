package com.backend.util;

import com.backend.service.DTO.CreerEvaluationMilieuStageDTO;
import com.backend.service.DTO.EvaluationEnumsDTO.NiveauAccordMilieuStage;
import com.backend.service.DTO.EvaluationEnumsDTO.OuiNonChoix;
import com.backend.service.DTO.EvaluationEnumsDTO.StageNumeroChoix;

import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;
import java.util.Map;

import static com.itextpdf.io.font.constants.StandardFonts.HELVETICA;

@Service
public class PdfGenerationMilieuStage {

    // Injection du template PDF à partir du chemin classpath
    @Value("classpath:documents/EvalMilieuStage.pdf")
    private Resource pdfTemplateResource;

    // --- COORDONNÉES X DES COLONNES LIKERT (Page 1 et 2) ---
    // Repris des estimations précises basées sur la structure de la page.
    private static final Map<NiveauAccordMilieuStage, Float> X_CHECKBOX_COLUMNS = Map.of(
            NiveauAccordMilieuStage.TOTALEMENT_EN_ACCORD, 300f,
            NiveauAccordMilieuStage.PLUTOT_EN_ACCORD, 362f,
            NiveauAccordMilieuStage.PLUTOT_DESACCORD, 424f,
            NiveauAccordMilieuStage.TOTALEMENT_DESACCORD, 485f,
            NiveauAccordMilieuStage.IMPOSSIBLE_DE_SE_PRONONCER, 547f
    );

    private static final float FONT_SIZE = 10f;
    private static final float FIELD_TEXT_SIZE = 9f;
    private static final String CHECK_MARK = "X";

    // --- Méthodes d'aide (adaptées au style PdfCanvas) ---

    /** Méthode utilitaire pour ajouter du texte à une position absolue (X, Y). */
    private void addText(PdfPage page, PdfFont font, String text, float x, float y) {
        if (text == null || text.isEmpty()) return;

        PdfCanvas canvas = new PdfCanvas(page);
        canvas.beginText()
                .setFontAndSize(font, FIELD_TEXT_SIZE) // Utilise FIELD_TEXT_SIZE pour le contenu
                .moveText(x, y)
                .showText(text)
                .endText()
                .release();
    }

    /** Méthode utilitaire pour dessiner le crochet 'X' à une position absolue (X, Y). */
    private void drawCheckMark(PdfPage page, PdfFont font, float x, float y) {
        // Ajustement vertical (Y - 2) pour centrer le 'X' dans la case
        PdfCanvas canvas = new PdfCanvas(page);
        canvas.beginText()
                .setFontAndSize(font, FONT_SIZE) // Utilise FONT_SIZE pour le checkmark
                .moveText(x, y - 2)
                .showText(CHECK_MARK)
                .endText()
                .release();
    }

    private void drawCircleAround(PdfPage page, float centerX, float centerY, float radius) {
        PdfCanvas canvas = new PdfCanvas(page);
        canvas.setLineWidth(1f);
        canvas.circle(centerX, centerY, radius);
        canvas.stroke();
        canvas.release();
    }

    private void surroundStageChoiceWithShape(PdfPage page, PdfFont font, StageNumeroChoix stage, boolean useCircle) {
        float yStage = 560f; // même Y que l'emplacement du 1/2
        float centerX = (stage == StageNumeroChoix.STAGE_1) ? 105f : 140f;
        float adjustY = yStage - 2f; // alignement similaire au drawCheckMark
        if (useCircle) {
            drawCircleAround(page, centerX, adjustY, 10f); // rayon ajustable
        }
    }

    /** Méthode utilitaire pour placer le X dans les colonnes d'évaluation Likert. */
    private void placeCheck(PdfPage page, PdfFont font, NiveauAccordMilieuStage niveau, float y) {
        if (niveau != null && X_CHECKBOX_COLUMNS.containsKey(niveau)) {
            float x = X_CHECKBOX_COLUMNS.get(niveau);
            drawCheckMark(page, font, x, y);
        }
    }

    /** * Gère le texte multiligne dans une zone rectangulaire (top-down) en utilisant PdfCanvas.
     * @param area Rectangle(X_gauche, Y_bas, Largeur, Hauteur)
     */
    private void addMultiLineText(PdfPage page, PdfFont font, String text, Rectangle area) {
        if (text == null || text.isEmpty()) return;

        PdfCanvas canvas = new PdfCanvas(page);
        String[] lines = text.split("\n");

        // currentY commence au sommet du rectangle moins la taille de la police pour la première ligne
        float currentY = area.getTop() - FIELD_TEXT_SIZE;
        float lineHeight = FIELD_TEXT_SIZE + 2;

        canvas.beginText().setFontAndSize(font, FIELD_TEXT_SIZE);

        for (String line : lines) {
            // Vérifie si la ligne suivante ne dépassera pas le bas du rectangle
            if (currentY < area.getBottom()) break;

            canvas.moveText(area.getLeft(), currentY).showText(line);
            currentY -= lineHeight;
        }

        canvas.endText().release();
    }

    // ----------------------------------------------------------------------
    // Méthode principale de remplissage (Retourne Base64 String)
    // ----------------------------------------------------------------------
    public String genererEtRemplirMilieuStagePdf(CreerEvaluationMilieuStageDTO dto) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfFont font = PdfFontFactory.createFont(HELVETICA);

        try (InputStream pdfInputStream = pdfTemplateResource.getInputStream();
             PdfReader reader = new PdfReader(pdfInputStream);
             PdfWriter writer = new PdfWriter(baos);
             PdfDocument pdf = new PdfDocument(reader, writer)) {

            remplirPage1(pdf.getPage(1), dto, font);
            remplirPage2(pdf.getPage(2), dto, font);

            pdf.close(); // Fermeture pour s'assurer que le contenu est écrit dans le ByteArrayOutputStream

        } catch (IOException e) {
            e.printStackTrace();
            throw new IOException("Erreur lors de la génération du PDF avec iText", e);
        }

        byte[] pdfBytes = baos.toByteArray();
        return Base64.getEncoder().encodeToString(pdfBytes);
    }

    // ----------------------------------------------------------------------
    // Remplissage Page 1
    // ----------------------------------------------------------------------
    private void remplirPage1(PdfPage page, CreerEvaluationMilieuStageDTO dto, PdfFont font) {
        // --- 1. Identification de l'entreprise (Coordonnées ajustées pour PdfCanvas) ---
        addText(page, font, dto.getNomEntreprise(), 40f, 592f);
        addText(page, font, dto.getPersonneContact(), 40f, 565f);
        addText(page, font, dto.getAdresse(), 90f, 548f);
        addText(page, font, dto.getVille(), 70f, 532f);
        addText(page, font, dto.getCodePostal(), 109f, 518f);
        addText(page, font, dto.getTelephone(), 362f, 548f);
        addText(page, font, dto.getTelecopieur(), 368f, 532f);

        // --- 2. Identification du stagiaire ---
        addText(page, font, dto.getNomStagiaire(), 42f, 445f);
        addText(page, font, dto.getDateDuStage(), 42f, 419f);

        // Stage (encercler): 1 ou 2. Y est la base de la case.
        float yStage = 403f;
        float radius = 5f;
        if (dto.getStageNumero() == StageNumeroChoix.STAGE_1) {
            drawCircleAround(page, 157f, yStage, radius);
        } else if (dto.getStageNumero() == StageNumeroChoix.STAGE_2) {
            drawCircleAround(page, 201f, yStage, radius);
        }

        // --- 3. ÉVALUATION (Coches) ---
        float yEval1 = 300f;
        float yEval2 = 254f;
        float yEval3 = 217f;

        placeCheck(page, font, dto.getTachesConformes(), yEval1);
        placeCheck(page, font, dto.getMesuresAccueil(), yEval2);
        placeCheck(page, font, dto.getTempsEncadrementSuffisant(), yEval3);

        // --- 4. Préciser le nombre d'heures/semaine ---
        float yHeuresPremierMois = 169f;
        float xHeures = 124f;
        addText(page, font, dto.getHeuresPremierMois(), xHeures, yHeuresPremierMois);
        addText(page, font, dto.getHeuresDeuxiemeMois(), xHeures, yHeuresPremierMois - 13f);
        addText(page, font, dto.getHeuresTroisiemeMois(), xHeures, yHeuresPremierMois - 26f);
    }

    // ----------------------------------------------------------------------
    // Remplissage Page 2
    // ----------------------------------------------------------------------
    private void remplirPage2(PdfPage page, CreerEvaluationMilieuStageDTO dto, PdfFont font) {

        // --- 1. ÉVALUATION (Suite des Coches) ---
        float yEval4 = 690f;
        float yEval5 = 655f;
        float yEval6 = 623f;
        float yEval7 = 576f;
        float yEval8 = 529f;
        float yEval9 = 491f;
        float yEval10 = 453f;

        float yEvalSection2 = 690f;

        placeCheck(page, font, dto.getEnvironnementSecurite(), yEval4);
        placeCheck(page, font, dto.getClimatTravail(), yEval5);
        placeCheck(page, font, dto.getMilieuAccessible(), yEval6);
        placeCheck(page, font, dto.getSalaireInteressant(), yEval7);

        addText(page, font, dto.getSalaireMontantHeure(), 100f, 558f);

        // Ajustement vertical des lignes restantes
        placeCheck(page, font, dto.getCommunicationSuperviseur(), yEval8);
        placeCheck(page, font, dto.getEquipementAdequat(), yEval9);
        placeCheck(page, font, dto.getVolumeTravailAcceptable(), yEval10);

        // --- 2. COMMENTAIRES (Zone de texte) ---
        addMultiLineText(page, font, dto.getCommentaires(), new Rectangle(38f, 385f, 550f, 15f));

        // --- 3. OBSERVATIONS GÉNÉRALES ---
        float xChoixObservations = 348f;

        if (dto.getMilieuAPrivilegier() == StageNumeroChoix.STAGE_1) {
            drawCheckMark(page, font, xChoixObservations, 328f);
        } else if (dto.getMilieuAPrivilegier() == StageNumeroChoix.STAGE_2) {
            drawCheckMark(page, font, xChoixObservations, 312f);
        }

        float yNb = switch (dto.getAccueillirStagiairesNb()) {
            case UN_STAGIAIRE -> 285f;
            case DEUX_STAGIAIRES -> 270f;
            case TROIS_STAGIAIRES -> 255f;
            case PLUS_DE_TROIS -> 240f;
        };
        drawCheckMark(page, font, xChoixObservations, yNb);

        float xOui = 472f;
        float xNon = 546f;

        float yDesire = 195f;
        if (dto.getDesireAccueillirMemeStagiaire() == OuiNonChoix.OUI) {
            drawCheckMark(page, font, xOui, yDesire);
        } else if (dto.getDesireAccueillirMemeStagiaire() == OuiNonChoix.NON) {
            drawCheckMark(page, font, xNon, yDesire);
        }

        float yQuarts = 147f;
        if (dto.getOffreQuartsVariables() == OuiNonChoix.OUI) {
            drawCheckMark(page, font, xOui, yQuarts);
            float yQuartsA = 137f;
            float yQuartsB = 137f;
            float yQuartsC = 137f;

            addText(page, font, dto.getQuartsADe(), 78f, yQuartsA);
            addText(page, font, dto.getQuartsAFin(), 146f, yQuartsA);
            addText(page, font, dto.getQuartsBDe(), 78f, yQuartsB);
            addText(page, font, dto.getQuartsBFin(), 146f, yQuartsB);
            addText(page, font, dto.getQuartsCDe(), 78f, yQuartsC);
            addText(page, font, dto.getQuartsCFin(), 146f, yQuartsC);
        } else if (dto.getOffreQuartsVariables() == OuiNonChoix.NON) {
            drawCheckMark(page, font, xNon, yQuarts);
        }

        addText(page, font, dto.getDateSignature(), 355f, 70f);
    }
}