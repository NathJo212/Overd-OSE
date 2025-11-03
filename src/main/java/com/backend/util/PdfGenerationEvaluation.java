package com.backend.util;

import com.backend.service.DTO.CreerEvaluationDTO;

import com.backend.service.DTO.NiveauAccordDTO;
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
import java.util.List;
import java.util.Map;

import static com.itextpdf.io.font.constants.StandardFonts.HELVETICA;

@Service
public class PdfGenerationEvaluation {

    @Value("classpath:documents/evaluation_stagiaire.pdf")
    private Resource pdfTemplateResource;

    // --- COORDONNÉES X DES COLONNES LIKERT ---
    private static final Map<NiveauAccordDTO, Float> X_CHECKBOX_COLUMNS = Map.of(
            NiveauAccordDTO.TOTALEMENT_EN_ACCORD, 296f,
            NiveauAccordDTO.PLUTOT_EN_ACCORD, 358f,
            NiveauAccordDTO.PLUTOT_EN_DESACCORD, 421f,
            NiveauAccordDTO.TOTALEMENT_EN_DESACCORD, 481f,
            NiveauAccordDTO.NON_APPLICABLE, 544f
    );

    private static final float FONT_SIZE = 10f;
    private static final String CHECK_MARK = "X";

    /**
     * Méthode principale mise à jour avec les nouveaux paramètres.
     */
    public String genererEtRemplirEvaluationPdf(CreerEvaluationDTO dto, String nomEtudiant, String programme, String nomEntreprise) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        PdfFont font = PdfFontFactory.createFont(HELVETICA);

        try (InputStream pdfInputStream = pdfTemplateResource.getInputStream();
             PdfReader reader = new PdfReader(pdfInputStream);
             PdfWriter writer = new PdfWriter(baos);
             PdfDocument pdf = new PdfDocument(reader, writer)) {

            remplirPage1(pdf, dto, font, nomEtudiant, programme, nomEntreprise);
            remplirPage2(pdf, dto, font);
            remplirPage3(pdf, dto, font);

            pdf.close(); // Fermeture ajoutée pour s'assurer que le contenu est écrit

        } catch (IOException e) {
            e.printStackTrace();
            throw new IOException("Erreur lors de la génération du PDF avec iText", e);
        }

        byte[] pdfBytes = baos.toByteArray();
        return Base64.getEncoder().encodeToString(pdfBytes);
    }

    // --- Méthodes d'aide (inchangées) ---

    private void addText(PdfPage page, PdfFont font, String text, float x, float y) {
        if (text == null || text.isEmpty()) return;

        PdfCanvas canvas = new PdfCanvas(page);
        canvas.beginText()
                .setFontAndSize(font, FONT_SIZE)
                .moveText(x, y)
                .showText(text)
                .endText()
                .release();
    }

    private void drawCheckMark(PdfPage page, PdfFont font, float x, float y) {
        // Ajustement vertical (Y - 2) pour centrer le 'X'
        addText(page, font, CHECK_MARK, x, y - 2);
    }

    private void placeCheck(PdfPage page, PdfFont font, NiveauAccordDTO accord, float y) {
        if (accord != null && X_CHECKBOX_COLUMNS.containsKey(accord)) {
            float x = X_CHECKBOX_COLUMNS.get(accord);
            drawCheckMark(page, font, x, y);
        }
    }

    private void placeCheck(PdfPage page, PdfFont font, NiveauAccordDTO accord, float y, float xOffset) {
        if (accord != null && X_CHECKBOX_COLUMNS.containsKey(accord)) {
            float x = X_CHECKBOX_COLUMNS.get(accord) + xOffset;
            drawCheckMark(page, font, x, y);
        }
    }


    /**
     * Gère le texte multiligne dans une zone rectangulaire (top-down).
     * @param area Rectangle(X_gauche, Y_bas, Largeur, Hauteur)
     */
    private void addMultiLineText(PdfPage page, PdfFont font, String text, Rectangle area) {
        if (text == null || text.isEmpty()) return;

        PdfCanvas canvas = new PdfCanvas(page);
        String[] lines = text.split("\n");
        // currentY commence au sommet du rectangle moins la taille de la police
        float currentY = area.getTop() - FONT_SIZE;
        float lineHeight = FONT_SIZE + 2;

        canvas.beginText().setFontAndSize(font, FONT_SIZE);

        for (String line : lines) {
            if (currentY < area.getBottom()) break;

            canvas.moveText(area.getLeft(), currentY).showText(line);
            currentY -= lineHeight;
        }

        canvas.endText().release();
    }

    // ----------------------------------------------------------------------
    // Remplissage Page 1
    // ----------------------------------------------------------------------
    private void remplirPage1(PdfDocument pdf, CreerEvaluationDTO dto, PdfFont font, String nomEtudiant, String programme, String nomEntreprise) {
        PdfPage page = pdf.getPage(1);

        // --- 1. Informations de base ---
        addText(page, font, nomEtudiant, 120f, 579f);
        addText(page, font, programme, 150f, 564f);
        addText(page, font, nomEntreprise, 150f, 547f);

        // --- 2. Informations du Superviseur ---
        addText(page, font, dto.getNomSuperviseur(), 150f, 532f);
        addText(page, font, dto.getFonctionSuperviseur(), 88f, 516f);
        addText(page, font, dto.getTelephoneSuperviseur(), 376f, 516f);

        // --- 3. PRODUCTIVITÉ (Coches) ---
        float yProdStart = 342f;
        float yProdSpacing = 23f;

        List<NiveauAccordDTO> prodChecks = List.of(
                dto.getProdPlanifierOrganiser(),
                dto.getProdComprendreDirectives(),
                dto.getProdRythmeSoutenu(),
                dto.getProdEtablirPriorites(),
                dto.getProdRespectEcheanciers()
        );
        for (int i = 0; i < prodChecks.size(); i++) {
            placeCheck(page, font, prodChecks.get(i), yProdStart - i * yProdSpacing);
        }

        // --- 4. Commentaires Productivité ---
        addMultiLineText(page, font, dto.getCommentairesProductivite(), new Rectangle(100f, 209f, 550f, 20f));
    }

    // ----------------------------------------------------------------------
    // Remplissage Page 2
    // ----------------------------------------------------------------------
    private void remplirPage2(PdfDocument pdf, CreerEvaluationDTO dto, PdfFont font) {
        PdfPage page = pdf.getPage(2);

        // --- 1. QUALITÉ DU TRAVAIL (Coches) ---
        float yQualStart = 692f;
        float ySpacingQual = 23f;

        List<NiveauAccordDTO> qualChecks = List.of(
                dto.getQualRespectMandats(),
                dto.getQualAttentionDetails(),
                dto.getQualVerifierTravail(),
                dto.getQualRechercherPerfectionnement(),
                dto.getQualAnalyseProblemes()
        );
        for (int i = 0; i < qualChecks.size(); i++) {
            placeCheck(page, font, qualChecks.get(i), yQualStart - i * ySpacingQual);
        }
        // Commentaires Qualité
        addMultiLineText(page, font, dto.getCommentairesQualiteTravail(), new Rectangle(100f, 581f, 550f, 20f));

        // --- 2. QUALITÉS DES RELATIONS INTERPERSONNELLES (Coches) ---
        float yRelStart = 485f;
        float ySpacingRel = 23f;
        float xSpacingRel = 5f;

        List<NiveauAccordDTO> relChecks = List.of(
                dto.getRelEtablirContacts(),
                dto.getRelContribuerEquipe(),
                dto.getRelAdapterCulture(),
                dto.getRelAccepterCritiques(),
                dto.getRelEtreRespectueux(),
                dto.getRelEcouteActive()
        );
        for (int i = 0; i < relChecks.size(); i++) {
            placeCheck(page, font, relChecks.get(i), yRelStart - i * ySpacingRel, xSpacingRel);
        }

        // Commentaires Relations
        addMultiLineText(page, font, dto.getCommentairesRelations(), new Rectangle(100f, 346f, 550f, 20f));

        // --- 3. HABILETÉS PERSONNELLES (Coches) ---
        float yHabStart = 255f;
        float ySpacingHab = 20f;
        float xSpacingHab = 5f;


        List<NiveauAccordDTO> habChecks = List.of(
                dto.getHabInteretMotivation(),
                dto.getHabExprimerIdees(),
                dto.getHabFairePreuveInitiative(),
                dto.getHabTravaillerSecuritaire(),
                dto.getHabSensResponsabilites(),
                dto.getHabPonctuelAssidu()
        );
        for (int i = 0; i < habChecks.size(); i++) {
            placeCheck(page, font, habChecks.get(i), yHabStart - i * ySpacingHab, xSpacingHab);
        }

        // Commentaires Habiletés
        addMultiLineText(page, font, dto.getCommentairesHabiletes(), new Rectangle(100f, 119f, 550f, 20f));
    }

    // ----------------------------------------------------------------------
    // Remplissage Page 3
    // ----------------------------------------------------------------------
    private void remplirPage3(PdfDocument pdf, CreerEvaluationDTO dto, PdfFont font) {
        PdfPage page = pdf.getPage(3);

        // --- 1. APPRÉCIATION GLOBALE (Coches) ---
        float yAppreciationStart = 719f;
        float yAppreciationSpacing = 13f;
        Float yAppreciation = switch (dto.getAppreciationGlobale() != null ? dto.getAppreciationGlobale() : "") {
            case "Les habiletés démontrées dépassent de beaucoup les attentes" -> yAppreciationStart;
            case "Les habiletés démontrées dépassent les attentes" -> yAppreciationStart - yAppreciationSpacing;
            case "Les habiletés démontrées répondent pleinement aux attentes" -> yAppreciationStart - 2 * yAppreciationSpacing;
            case "Les habiletés démontrées répondent partiellement aux attentes" -> yAppreciationStart - 3 * yAppreciationSpacing;
            case "Les habiletés démontrées ne répondent pas aux attentes" -> yAppreciationStart - 4 * yAppreciationSpacing;
            default -> null;
        };

        if (yAppreciation != null) {
            drawCheckMark(page, font, 480f, yAppreciation);
        }

        // --- 2. PRÉCISEZ VOTRE APPRÉCIATION  ---
        addMultiLineText(page, font, dto.getPrecisionAppreciation(), new Rectangle(34f, 622f, 540f, 360f));

        // --- 3. Discussion avec le stagiaire ---
        if (dto.getDiscussionAvecStagiaire() != null) {
            float yDiscussion = 530f;
            if (dto.getDiscussionAvecStagiaire()) {
                drawCheckMark(page, font, 329f, yDiscussion); // Oui
            } else {
                drawCheckMark(page, font, 403f, yDiscussion); // Non
            }
        }

        // --- 4. Heures d'encadrement ---
        addText(page, font, dto.getHeuresEncadrementSemaine() != null ? dto.getHeuresEncadrementSemaine().toString() : "", 520f, 500f);

        // --- 5. Accueillir prochain stage ---
        float yAccueil = 5568f;
        Float xAccueil = switch (dto.getEntrepriseAccueillirProchainStage()) {
            case CreerEvaluationDTO.entrepriseProchainStageChoix.OUI -> 220f;
            case CreerEvaluationDTO.entrepriseProchainStageChoix.NON -> 314f;
            case CreerEvaluationDTO.entrepriseProchainStageChoix.PEUT_ETRE -> 427f;
            default -> null;
        };
        if (xAccueil != null) {
            drawCheckMark(page, font, xAccueil, yAccueil);
        }

        // --- 6. Formation technique suffisante ---
        addMultiLineText(page, font, dto.getFormationTechniqueSuffisante(), new Rectangle(34f, 413f, 540f, 360f));

        // --- 7. Signature et Date ---
        addText(page, font, dto.getNomSuperviseur(), 70f, 338f);
        addText(page, font, dto.getFonctionSuperviseur(), 345f, 338f);
        addText(page, font, String.valueOf(dto.getDateSignature()), 326f, 307f);
    }
}