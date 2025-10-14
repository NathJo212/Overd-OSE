package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class LettreDeMotivationNonDisponibleException extends Exception{
    private final ErrorCode errorCode;

    public LettreDeMotivationNonDisponibleException() {
        super("Lettre de motivation non disponible");
        this.errorCode = ErrorCode.LETTRE_MOTIVATION_NON_DISPONIBLE;
    }
}
