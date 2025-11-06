package com.backend.service.DTO;

public enum NiveauAccordDTO {
    TOTALEMENT_EN_ACCORD("Totalement en accord"),
    PLUTOT_EN_ACCORD("Plutôt en accord"),
    PLUTOT_EN_DESACCORD("Plutôt en désaccord"),
    TOTALEMENT_EN_DESACCORD("Totalement en désaccord"),
    NON_APPLICABLE("N/A");

    private final String label;

    NiveauAccordDTO(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}