package com.backend.service.DTO;

import com.fasterxml.jackson.annotation.JsonValue;

public enum StatutStageDTO {
    PAS_COMMENCE("Pas commencé"),
    EN_COURS("En cours"),
    TERMINE("Terminé");

    private final String label;

    StatutStageDTO(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    @JsonValue
    public Object toJson() {
        return new java.util.LinkedHashMap<String, String>() {{
            put("code", name());
            put("label", label);
        }};
    }
}
