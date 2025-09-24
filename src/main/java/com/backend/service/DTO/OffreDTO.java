package com.backend.service.DTO;

import com.backend.modele.Offre;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    private String progEtude;
    private String lieuStage;
    private String remuneration;
    private String dateLimite;

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
        return dto;
    }
}