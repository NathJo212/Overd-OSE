package com.backend.modele;


public enum NiveauAccord {
    TOTALEMENT_EN_ACCORD("Totalement en accord"),
    PLUTOT_EN_ACCORD("Plutôt en accord"),
    PLUTOT_EN_DESACCORD("Plutôt en désaccord"),
    TOTALEMENT_EN_DESACCORD("Totalement en désaccord"),
    NON_APPLICABLE("N/A");

    private final String label;

    NiveauAccord(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}