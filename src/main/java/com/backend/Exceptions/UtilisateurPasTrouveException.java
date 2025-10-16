package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class UtilisateurPasTrouveException extends Exception {
    private final ErrorCode errorCode;

    public UtilisateurPasTrouveException() {
        super("Utilisateur non trouvé");
        this.errorCode = ErrorCode.USER_NOT_FOUND;
    }
}
