package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class CandidatureNonTrouveeException extends Exception {
    private final ErrorCode errorCode;

    public CandidatureNonTrouveeException() {
        super("Candidature non trouvée");
        this.errorCode = ErrorCode.CANDIDATURE_NOT_FOUND;
    }
}