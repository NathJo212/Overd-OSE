package com.backend.service.DTO;

import com.backend.modele.SessionAcademique;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * DTO pour les sessions académiques
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SessionAcademiqueDTO {

    private Long id;
    private String session;
    private String annee;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private boolean estCourante;
    private boolean estActive;
    private String nomComplet;

    public SessionAcademiqueDTO toDTO(SessionAcademique sessionAcademique) {
        SessionAcademiqueDTO dto = new SessionAcademiqueDTO();
        dto.setId(sessionAcademique.getId());
        dto.setSession(sessionAcademique.getSession() != null ? sessionAcademique.getSession().name() : null);
        dto.setAnnee(sessionAcademique.getAnnee());
        dto.setDateDebut(sessionAcademique.getDateDebut());
        dto.setDateFin(sessionAcademique.getDateFin());
        dto.setEstCourante(sessionAcademique.isEstCourante());
        dto.setEstActive(sessionAcademique.isEstActive());
        dto.setNomComplet(sessionAcademique.getNomComplet());
        return dto;
    }

    public static SessionAcademiqueDTO simple(String session, String annee) {
        SessionAcademiqueDTO dto = new SessionAcademiqueDTO();
        dto.setSession(session);
        dto.setAnnee(annee);
        return dto;
    }
}