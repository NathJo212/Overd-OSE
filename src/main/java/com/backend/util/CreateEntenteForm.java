package com.backend.util;

import com.backend.modele.EntenteStage;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.interactive.form.PDAcroForm;
import org.apache.pdfbox.pdmodel.interactive.form.PDTextField;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.io.IOException;
import java.time.temporal.ChronoUnit;

public class CreateEntenteForm {

    // Fill the existing PDF AcroForm and return the flattened PDF as bytes
    public static byte[] generatePdfBytes(EntenteStage entente, String gestionnaireNom) throws IOException {
        if (entente == null) throw new IllegalArgumentException("Entente null");

        try (InputStream is = CreateEntenteForm.class.getResourceAsStream("/documents/ContratEntente.pdf")) {
            if (is == null) throw new FileNotFoundException("Template ContratEntente.pdf introuvable");
            try (PDDocument doc = Loader.loadPDF(is.readAllBytes())) {
                PDAcroForm acroForm = doc.getDocumentCatalog().getAcroForm();
                if (acroForm == null) {
                    // Create an empty form so we can still write fields if template lacks one
                    acroForm = new PDAcroForm(doc);
                    doc.getDocumentCatalog().setAcroForm(acroForm);
                }

                String nomGestionnaire = gestionnaireNom != null ? gestionnaireNom : "-";
                String nomEmployeur = entente.getEmployeur() != null ? entente.getEmployeur().getNomEntreprise() : "-";
                String nomEtudiant = entente.getEtudiant() != null
                        ? entente.getEtudiant().getPrenom() + " " + entente.getEtudiant().getNom()
                        : "-";
                String lieu = entente.getLieu() != null ? entente.getLieu() : "-";
                String taux = entente.getRemuneration() != null ? entente.getRemuneration() : "-";
                String description = entente.getDescription() != null ? entente.getDescription() : "-";
                String dateDebut = entente.getDateDebut() != null ? entente.getDateDebut().toString() : "-";
                String dateFin = entente.getDateFin() != null ? entente.getDateFin().toString() : "-";
                long semaines = 0;
                if (entente.getDateDebut() != null && entente.getDateFin() != null) {
                    semaines = ChronoUnit.WEEKS.between(entente.getDateDebut(), entente.getDateFin());
                    if (semaines < 0) semaines = 0;
                }

                setIfPresent(acroForm, "nom_gestionnaire", nomGestionnaire);
                setIfPresent(acroForm, "nom_employeur", nomEmployeur);
                setIfPresent(acroForm, "nom_etudiant", nomEtudiant);
                setIfPresent(acroForm, "offre_lieuStage", lieu);
                setIfPresent(acroForm, "offre_tauxHoraire", taux);
                setIfPresent(acroForm, "offre_description", description);
                setIfPresent(acroForm, "dateDebut", dateDebut);
                setIfPresent(acroForm, "dateFin", dateFin);
                setIfPresent(acroForm, "semaines", String.valueOf(semaines));
                setIfPresent(acroForm, "date_signature_etudiant", entente.getDateSignatureEtudiant() != null ? entente.getDateSignatureEtudiant().toString() : "-");
                setIfPresent(acroForm, "date_signature_employeur", entente.getDateSignatureEmployeur() != null ? entente.getDateSignatureEmployeur().toString() : "-");
                setIfPresent(acroForm, "date_signature_gestionnaire", entente.getDateSignatureGestionnaire() != null ? entente.getDateSignatureGestionnaire().toString() : "-");

                // Flatten so fields become static content
                acroForm.flatten();

                try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                    doc.save(baos);
                    return baos.toByteArray();
                }
            }
        }
    }

    private static void setIfPresent(PDAcroForm form, String name, String value) throws IOException {
        PDTextField field = (PDTextField) form.getField(name);
        if (field != null) {
            field.setValue(value != null ? value : "-");
        }
    }

    // Developer helper: create a fillable form overlay once (optional)
    public static void main(String[] args) throws Exception {
        try (InputStream is = CreateEntenteForm.class.getResourceAsStream("/documents/ContratEntente.pdf")) {
            if (is == null) throw new RuntimeException("Template not found");
            PDDocument doc = Loader.loadPDF(is.readAllBytes());
            PDPage page = doc.getPage(0);

            PDAcroForm acroForm = new PDAcroForm(doc);
            doc.getDocumentCatalog().setAcroForm(acroForm);

            addField(doc, acroForm, page, "nom_gestionnaire", 170, 640, 200, 15);
            addField(doc, acroForm, page, "nom_employeur", 170, 620, 200, 15);
            addField(doc, acroForm, page, "nom_etudiant", 170, 600, 200, 15);
            addField(doc, acroForm, page, "offre_lieuStage", 170, 560, 200, 15);
            addField(doc, acroForm, page, "offre_tauxHoraire", 170, 510, 200, 15);
            addField(doc, acroForm, page, "offre_description", 170, 470, 300, 40);
            addField(doc, acroForm, page, "dateDebut", 170, 430, 100, 15);
            addField(doc, acroForm, page, "dateFin", 300, 430, 100, 15);
            addField(doc, acroForm, page, "semaines", 170, 410, 50, 15);
            addField(doc, acroForm, page, "date_signature_etudiant", 150, 150, 100, 15);
            addField(doc, acroForm, page, "date_signature_employeur", 150, 130, 100, 15);
            addField(doc, acroForm, page, "date_signature_gestionnaire", 150, 110, 100, 15);

            doc.save(new File("ContratEntenteForm.pdf"));
            doc.close();
            System.out.println("Created fillable template: ContratEntenteForm.pdf");
        }
    }

    private static void addField(PDDocument doc, PDAcroForm form, PDPage page,
                                 String name, float x, float y, float width, float height) throws Exception {
        PDTextField field = new PDTextField(form);
        field.setPartialName(name);
        form.getFields().add(field);

        PDRectangle rect = new PDRectangle(x, y, width, height);
        var widget = field.getWidgets().get(0);
        widget.setRectangle(rect);
        widget.setPage(page);
        page.getAnnotations().add(widget);
    }
}
