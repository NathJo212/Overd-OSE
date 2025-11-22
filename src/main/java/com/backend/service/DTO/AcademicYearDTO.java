package com.backend.service.DTO;

import com.backend.modele.AcademicSession.AcademicYear;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO pour représenter une année académique
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AcademicYearDTO {
    private String yearString;        // Ex: "2025-2026"
    private String startYearString;   // Ex: "2025"
    private int startYear;            // Ex: 2025
    private int endYear;              // Ex: 2026
    private boolean isCurrent;        // Si c'est l'année courante

    public static AcademicYearDTO fromModel(AcademicYear year, boolean isCurrent) {
        AcademicYearDTO dto = new AcademicYearDTO();
        dto.setYearString(year.getYearString());
        dto.setStartYearString(year.getStartYearString());
        dto.setStartYear(year.getStartYear());
        dto.setEndYear(year.getEndYear());
        dto.setCurrent(isCurrent);
        return dto;
    }
}


