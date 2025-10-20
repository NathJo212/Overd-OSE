package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class StatutCandidatureInvalideException extends RuntimeException {
    private final ErrorCode errorCode;

    public StatutCandidatureInvalideException(String message) {
        super("La candidature doit être approuvée par l'employeur avant de pouvoir être acceptée ou refusée par l'étudiant");
        this.errorCode = ErrorCode.STATUT_CANDIDATURE_INVALID;
    }
}