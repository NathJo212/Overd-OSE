package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class CandidatureNonDisponibleException extends Exception {
    private final ErrorCode errorCode;

    public CandidatureNonDisponibleException() {
        super("Candidature non disponible");
        this.errorCode = ErrorCode.CANDIDATURE_NON_DISPONIBLE;
    }
}
