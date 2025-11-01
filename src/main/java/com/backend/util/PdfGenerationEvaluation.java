package com.backend.util;

import com.backend.service.DTO.EvaluationDTO;
import com.backend.modele.NiveauAccord;

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
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;
import java.util.Map;

import static com.itextpdf.io.font.constants.StandardFonts.HELVETICA;

@Service
public class PdfGenerationEvaluation {

    private final ResourceLoader resourceLoader;

    @Value("classpath:documents/evaluation_stagiaire.pdf")
    private Resource pdfTemplateResource;

    // --- COORDONNÉES X DES COLONNES LIKERT ---
    private static final Map<NiveauAccord, Float> X_CHECKBOX_COLUMNS = Map.of(
            NiveauAccord.TOTALEMENT_EN_ACCORD, 448f,
            NiveauAccord.PLUTOT_EN_ACCORD, 486f,
            NiveauAccord.PLUTOT_EN_DESACCORD, 524f,
            NiveauAccord.TOTALEMENT_EN_DESACCORD, 562f,
            NiveauAccord.NON_APPLICABLE, 600f
    );

    private static final float FONT_SIZE = 10f;
    private static final String CHECK_MARK = "X";

    public PdfGenerationEvaluation(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    /**
     * Méthode principale mise à jour avec les nouveaux paramètres.
     */
    public String genererEtRemplirEvaluationPdf(EvaluationDTO dto, String nomEtudiant, String programme, String nomEntreprise) throws IOException {
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

    private void placeCheck(PdfPage page, PdfFont font, NiveauAccord accord, float y) {
        if (accord != null && X_CHECKBOX_COLUMNS.containsKey(accord)) {
            float x = X_CHECKBOX_COLUMNS.get(accord);
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
    // Remplissage Page 1 (Signatures et Coordonnées révisées)
    // ----------------------------------------------------------------------
    private void remplirPage1(PdfDocument pdf, EvaluationDTO dto, PdfFont font, String nomEtudiant, String programme, String nomEntreprise) {
        PdfPage page = pdf.getPage(1);

        // --- 1. Informations de base (X ajusté à 170f, selon votre code) ---
        addText(page, font, nomEtudiant, 170f, 745f);
        addText(page, font, programme, 170f, 728f);
        addText(page, font, nomEntreprise, 170f, 711f);

        // --- 2. Informations du Superviseur ---
        addText(page, font, dto.getNomSuperviseur(), 150f, 675f);
        addText(page, font, dto.getFonctionSuperviseur(), 150f, 658f);
        addText(page, font, dto.getTelephoneSuperviseur(), 500f, 658f);

        // --- 3. PRODUCTIVITÉ (Coches) ---
        float yProdStart = 605f;
        float ySpacing = 20f;

        placeCheck(page, font, dto.getProdPlanifierOrganiser(), yProdStart);
        placeCheck(page, font, dto.getProdComprendreDirectives(), yProdStart - ySpacing);
        placeCheck(page, font, dto.getProdRythmeSoutenu(), yProdStart - 2 * ySpacing);
        placeCheck(page, font, dto.getProdEtablirPriorites(), yProdStart - 3 * ySpacing);
        placeCheck(page, font, dto.getProdRespectEcheanciers(), yProdStart - 4 * ySpacing);

        // --- 4. Commentaires Productivité (RÉVISÉ : Y_bas ajusté à 430f, Hauteur à 60f) ---
        // Permet plus d'espace et un meilleur alignement vertical sous le tableau.
        addMultiLineText(page, font, dto.getCommentairesProductivite(), new Rectangle(80f, 430f, 500f, 60f));
    }

    // ----------------------------------------------------------------------
    // Remplissage Page 2 (Coordonnées révisées)
    // ----------------------------------------------------------------------
    private void remplirPage2(PdfDocument pdf, EvaluationDTO dto, PdfFont font) {
        PdfPage page = pdf.getPage(2);

        // --- 1. QUALITÉ DU TRAVAIL (Coches) ---
        float yQualStart = 720f;
        float ySpacingQual = 20f;

        placeCheck(page, font, dto.getQualRespectMandats(), yQualStart);
        placeCheck(page, font, dto.getQualAttentionDetails(), yQualStart - ySpacingQual);
        placeCheck(page, font, dto.getQualVerifierTravail(), yQualStart - 2 * ySpacingQual);
        placeCheck(page, font, dto.getQualRechercherPerfectionnement(), yQualStart - 3 * ySpacingQual);
        placeCheck(page, font, dto.getQualAnalyseProblemes(), yQualStart - 4 * ySpacingQual);

        // Commentaires Qualité (RÉVISÉ : Y_bas ajusté à 570f, Hauteur à 50f)
        addMultiLineText(page, font, dto.getCommentairesQualiteTravail(), new Rectangle(80f, 570f, 500f, 50f));

        // --- 2. QUALITÉS DES RELATIONS INTERPERSONNELLES (Coches) ---
        float yRelStart = 500f;
        float ySpacingRel = 19f;

        placeCheck(page, font, dto.getRelEtablirContacts(), yRelStart);
        placeCheck(page, font, dto.getRelContribuerEquipe(), yRelStart - ySpacingRel);
        placeCheck(page, font, dto.getRelAdapterCulture(), yRelStart - 2 * ySpacingRel);
        placeCheck(page, font, dto.getRelAccepterCritiques(), yRelStart - 3 * ySpacingRel);
        placeCheck(page, font, dto.getRelEtreRespectueux(), yRelStart - 4 * ySpacingRel);
        placeCheck(page, font, dto.getRelEcouteActive(), yRelStart - 5 * ySpacingRel);

        // Commentaires Relations (RÉVISÉ : Y_bas ajusté à 340f, Hauteur à 50f)
        addMultiLineText(page, font, dto.getCommentairesRelations(), new Rectangle(80f, 340f, 500f, 50f));

        // --- 3. HABILETÉS PERSONNELLES (Coches) ---
        float yHabStart = 275f;
        float ySpacingHab = 19f;

        placeCheck(page, font, dto.getHabInteretMotivation(), yHabStart);
        placeCheck(page, font, dto.getHabExprimerIdees(), yHabStart - ySpacingHab);
        placeCheck(page, font, dto.getHabFairePreuveInitiative(), yHabStart - 2 * ySpacingHab);
        placeCheck(page, font, dto.getHabTravaillerSecuritaire(), yHabStart - 3 * ySpacingHab);
        placeCheck(page, font, dto.getHabSensResponsabilites(), yHabStart - 4 * ySpacingHab);
        placeCheck(page, font, dto.getHabPonctuelAssidu(), yHabStart - 5 * ySpacingHab);

        // Commentaires Habiletés (RÉVISÉ : Y_bas ajusté à 110f, Hauteur à 50f)
        addMultiLineText(page, font, dto.getCommentairesHabiletés(), new Rectangle(80f, 110f, 500f, 50f));
    }

    // ----------------------------------------------------------------------
    // Remplissage Page 3 (Coordonnées révisées)
    // ----------------------------------------------------------------------
    private void remplirPage3(PdfDocument pdf, EvaluationDTO dto, PdfFont font) {
        PdfPage page = pdf.getPage(3);

        // --- 1. APPRÉCIATION GLOBALE (Coches) ---
        float yAppreciationStart = 720f;
        float yAppreciationSpacing = 15.5f;
        Float yAppreciation = switch (dto.getAppreciationGlobale() != null ? dto.getAppreciationGlobale() : "") {
            case "Les habiletés démontrées dépassent de beaucoup les attentes" -> yAppreciationStart;
            case "Les habiletés démontrées dépassent les attentes" -> yAppreciationStart - yAppreciationSpacing;
            case "Les habiletés démontrées répondent pleinement aux attentes" -> yAppreciationStart - 2 * yAppreciationSpacing;
            case "Les habiletés démontrées répondent partiellement aux attentes" -> yAppreciationStart - 3 * yAppreciationSpacing;
            case "Les habiletés démontrées ne répondent pas aux attentes" -> yAppreciationStart - 4 * yAppreciationSpacing;
            default -> null;
        };

        if (yAppreciation != null) {
            drawCheckMark(page, font, 70f, yAppreciation);
        }

        // --- 2. PRÉCISEZ VOTRE APPRÉCIATION (RÉVISÉ : Y_bas ajusté à 580f, Hauteur à 60f) ---
        addMultiLineText(page, font, dto.getPrecisionAppreciation(), new Rectangle(80f, 580f, 500f, 60f));

        // --- 3. Discussion avec le stagiaire (RÉVISÉ : X ajusté) ---
        if (dto.getDiscussionAvecStagiaire() != null) {
            float yDiscussion = 555f;
            if (dto.getDiscussionAvecStagiaire()) {
                drawCheckMark(page, font, 250f, yDiscussion); // Oui
            } else {
                drawCheckMark(page, font, 360f, yDiscussion); // Non
            }
        }

        // --- 4. Heures d'encadrement ---
        addText(page, font, dto.getHeuresEncadrementSemaine() != null ? dto.getHeuresEncadrementSemaine().toString() : "", 520f, 530f);

        // --- 5. Accueillir prochain stage (RÉVISÉ : X ajusté) ---
        float yAccueil = 505f;
        Float xAccueil = switch (dto.getEntrepriseAccueillirProchainStage() != null ? dto.getEntrepriseAccueillirProchainStage() : "") {
            case "Oui" -> 410f;
            case "Non" -> 470f;
            case "Peut-être" -> 530f;
            default -> null;
        };
        if (xAccueil != null) {
            drawCheckMark(page, font, xAccueil, yAccueil);
        }

        // --- 6. Formation technique suffisante (RÉVISÉ : X ajusté) ---
        if (dto.getFormationTechniqueSuffisante() != null) {
            float yFormation = 480f;
            if (dto.getFormationTechniqueSuffisante()) {
                drawCheckMark(page, font, 540f, yFormation); // Oui
            } else {
                drawCheckMark(page, font, 590f, yFormation); // Non
            }
        }

        // --- 7. Signature et Date ---
        addText(page, font, dto.getNomSuperviseur(), 150f, 440f);
        addText(page, font, dto.getFonctionSuperviseur(), 150f, 400f);
        addText(page, font, dto.getDateSignature(), 450f, 400f);
    }
}