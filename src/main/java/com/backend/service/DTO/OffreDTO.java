package com.backend.service.DTO;

import com.backend.modele.Offre;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OffreDTO {

    private Long id;
    private AuthResponseDTO authResponseDTO;
    private String titre;
    private String description;
    private LocalDate date_debut;
    private LocalDate date_fin;
    private int annee;
    private ProgrammeDTO progEtude;
    private String lieuStage;
    private String remuneration;
    private String horaire;
    private Integer dureeHebdomadaire;
    private String responsabilitesEtudiant;
    private String responsabilitesEmployeur;
    private String responsabiliteCollege;
    private String objectifs;
    private LocalDate dateLimite;
    private String messageRefus;
    private String statutApprouve;
    private EmployeurDTO employeurDTO;

    public OffreDTO toDTO(Offre offre) {
        OffreDTO dto = new OffreDTO();
        dto.setId(offre.getId());
        dto.setAuthResponseDTO(this.authResponseDTO);
        dto.setTitre(offre.getTitre());
        dto.setDescription(offre.getDescription());
        dto.setDate_debut(offre.getDate_debut());
        dto.setDate_fin(offre.getDate_fin());
        dto.setAnnee(offre.getAnnee());
        dto.setProgEtude(ProgrammeDTO.toDTO(offre.getProgEtude()));
        dto.setLieuStage(offre.getLieuStage());
        dto.setRemuneration(offre.getRemuneration());
        dto.setHoraire(offre.getHoraire());
        dto.setDureeHebdomadaire(offre.getDureeHebdomadaire());
        dto.setResponsabilitesEtudiant(offre.getResponsabilitesEtudiant());
        dto.setResponsabilitesEmployeur(offre.getResponsabilitesEmployeur());
        dto.setResponsabiliteCollege(offre.getResponsabilitesCollege());
        dto.setObjectifs(offre.getObjectifs());
        dto.setDateLimite(offre.getDateLimite());
        dto.setMessageRefus(offre.getMessageRefus());
        dto.setStatutApprouve(offre.getStatutApprouve() != null ? offre.getStatutApprouve().toString() : "ATTENTE");
        dto.setEmployeurDTO(new EmployeurDTO().toDTO(offre.getEmployeur()));
        return dto;
    }
}