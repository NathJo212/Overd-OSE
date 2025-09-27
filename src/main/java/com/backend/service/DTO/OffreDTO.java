package com.backend.service.DTO;

import com.backend.modele.Offre;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OffreDTO {

    private Long id;
    private AuthResponseDTO authResponseDTO;
    private String titre;
    private String description;
    private String date_debut;
    private String date_fin;
    private ProgrammeDTO progEtude;
    private String lieuStage;
    private String remuneration;
    private String dateLimite;
    private String messageRefus;
    private EmployeurDTO employeurDTO;

    public OffreDTO toDTO(Offre offre) {
        OffreDTO dto = new OffreDTO();
        dto.setId(offre.getId());
        dto.setAuthResponseDTO(this.authResponseDTO);
        dto.setTitre(offre.getTitre());
        dto.setDescription(offre.getDescription());
        dto.setDate_debut(offre.getDate_debut());
        dto.setDate_fin(offre.getDate_fin());
        dto.setProgEtude(offre.getProgEtude());
        dto.setLieuStage(offre.getLieuStage());
        dto.setRemuneration(offre.getRemuneration());
        dto.setDateLimite(offre.getDateLimite());
        dto.setEmployeurDTO(new EmployeurDTO().toDTO(offre.getEmployeur()));
        return dto;
    }
}