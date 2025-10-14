package com.backend.Exceptions;

public class UtilisateurPasTrouveException extends Exception {
    public UtilisateurPasTrouveException() {
        super("Utilisateur non trouvé");

    }
}
