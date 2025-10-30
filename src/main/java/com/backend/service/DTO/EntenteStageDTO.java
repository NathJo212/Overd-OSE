package com.backend.service.DTO;

import com.backend.modele.EntenteStage;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class EntenteStageDTO {
    private Long id;
    private Long etudiantId;
    private String etudiantNomComplet;
    private String etudiantEmail;
    private String employeurContact;
    private String employeurEmail;
    private Long offreId;
    private String titre;
    private String description;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String horaire;
    private Integer dureeHebdomadaire;
    private String remuneration;
    private String responsabilites;
    private String objectifs;
    private byte[] documentPdf;
    private String etudiantSignature; // EN_ATTENTE, SIGNEE, REFUSEE
    private String employeurSignature;
    private String statut; // EN_ATTENTE, SIGNEE, ANNULEE
    private boolean archived;
    private LocalDateTime dateCreation;

    public EntenteStageDTO toDTO(EntenteStage entente) {
        EntenteStageDTO dto = new EntenteStageDTO();
        dto.setId(entente.getId());
        dto.setEtudiantId(entente.getEtudiant().getId());
        dto.setEtudiantNomComplet(entente.getEtudiant().getPrenom() + " " + entente.getEtudiant().getNom());
        dto.setEtudiantEmail(entente.getEtudiant().getEmail());
        dto.setEmployeurContact(entente.getEmployeur().getContact());
        dto.setEmployeurEmail(entente.getEmployeur().getEmail());
        dto.setOffreId(entente.getOffre() != null ? entente.getOffre().getId() : null);
        dto.setTitre(entente.getTitre());
        dto.setDescription(entente.getDescription());
        dto.setDateDebut(entente.getDateDebut());
        dto.setDateFin(entente.getDateFin());
        dto.setHoraire(entente.getHoraire());
        dto.setDureeHebdomadaire(entente.getDureeHebdomadaire());
        dto.setRemuneration(entente.getRemuneration());
        dto.setResponsabilites(entente.getResponsabilites());
        dto.setObjectifs(entente.getObjectifs());
        dto.setDocumentPdf(entente.getDocumentPdf());
        dto.setEtudiantSignature(entente.getEtudiantSignature() != null ? entente.getEtudiantSignature().name() : null);
        dto.setEmployeurSignature(entente.getEmployeurSignature() != null ? entente.getEmployeurSignature().name() : null);
        dto.setStatut(entente.getStatut() != null ? entente.getStatut().name() : null);
        dto.setArchived(entente.isArchived());
        dto.setDateCreation(entente.getDateCreation());
        return dto;
    }
}
