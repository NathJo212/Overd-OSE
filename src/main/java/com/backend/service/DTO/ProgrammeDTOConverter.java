package com.backend.service.DTO;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class ProgrammeDTOConverter implements AttributeConverter<ProgrammeDTO, String> {

    @Override
    public String convertToDatabaseColumn(ProgrammeDTO attribute) {
        return attribute != null ? attribute.getLabel() : null;
    }

    @Override
    public ProgrammeDTO convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        for (ProgrammeDTO p : ProgrammeDTO.values()) {
            if (p.getLabel().equals(dbData)) {
                return p;
            }
        }
        throw new IllegalArgumentException("Unknown programme label: " + dbData);
    }
}