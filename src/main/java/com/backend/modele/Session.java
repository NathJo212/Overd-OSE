package com.backend.modele;

public enum Session {
    AUTOMNE("Automne"),
    HIVER("Hiver"),
    ETE("Été");

    private final String nom;

    Session(String nom) {
        this.nom = nom;
    }

    public String getNom() {
        return nom;
    }

    public static Session fromString(String nom) {
        if (nom == null) {
            return null;
        }
        String nomNormalise = nom.toUpperCase().trim();
        return switch (nomNormalise) {
            case "AUTOMNE", "FALL" -> AUTOMNE;
            case "HIVER", "WINTER" -> HIVER;
            case "ÉTÉ", "ETE", "SUMMER" -> ETE;
            default -> throw new IllegalArgumentException("Session invalide: " + nom);
        };
    }
}