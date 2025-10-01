package com.backend.modele;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter()
public class ProgrammeConverter implements AttributeConverter<Programme, String> {

    @Override
    public String convertToDatabaseColumn(Programme attribute) {
        return attribute != null ? attribute.getLabel() : null;
    }

    @Override
    public Programme convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        for (Programme p : Programme.values()) {
            if (p.getLabel().equals(dbData)) {
                return p;
            }
        }
        throw new IllegalArgumentException("Unknown programme label: " + dbData);
    }
}