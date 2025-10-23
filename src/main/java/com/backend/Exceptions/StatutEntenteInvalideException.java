package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class StatutEntenteInvalideException extends Exception {

    private final ErrorCode errorCode;

    public StatutEntenteInvalideException() {
        super("Statut d'entente invalide");
        this.errorCode = ErrorCode.ENTENTE_STATUT_INVALID;
    }
}