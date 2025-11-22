package com.backend.service.DTO;

import com.backend.modele.AcademicSession;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO pour représenter une session académique complète (Session + Année)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AcademicSessionDTO {
    private String sessionKey;        // Ex: "HIVER_2025", "AUTOMNE_2024"
    private String sessionName;       // Ex: "Hiver", "Automne", "Été"
    private int year;                 // Ex: 2025
    private String displayName;       // Ex: "Hiver 2025"
    private boolean isCurrent;        // Si c'est la session courante

    public static AcademicSessionDTO fromSessionAndYear(AcademicSession.Session session, int year, boolean isCurrent) {
        AcademicSessionDTO dto = new AcademicSessionDTO();
        dto.setSessionKey(session.name() + "_" + year);
        dto.setSessionName(getSessionDisplayName(session));
        dto.setYear(year);
        dto.setDisplayName(getSessionDisplayName(session) + " " + year);
        dto.setCurrent(isCurrent);
        return dto;
    }

    private static String getSessionDisplayName(AcademicSession.Session session) {
        return switch (session) {
            case AUTOMNE -> "Automne";
            case HIVER -> "Hiver";
            case ETE -> "Été";
        };
    }
}


