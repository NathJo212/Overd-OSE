package com.backend.service.DTO;

import com.backend.modele.AnneeAcademique;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AnneeAcademiqueDTO {

    private Long id;
    private Integer anneeDebut;
    private Integer anneeFin;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String libelle;
    private boolean estCourante;
    private boolean estPassee;
    private boolean estFuture;

    public static AnneeAcademiqueDTO toDTO(AnneeAcademique annee) {
        if (annee == null) {
            return null;
        }

        AnneeAcademiqueDTO dto = new AnneeAcademiqueDTO();
        dto.setId(annee.getId());
        dto.setAnneeDebut(annee.getAnneeDebut());
        dto.setAnneeFin(annee.getAnneeFin());
        dto.setDateDebut(annee.getDateDebut());
        dto.setDateFin(annee.getDateFin());
        dto.setLibelle(annee.getLibelle());
        dto.setEstCourante(annee.estCourante());
        dto.setEstPassee(annee.estPassee());
        dto.setEstFuture(annee.estFuture());
        return dto;
    }
}
