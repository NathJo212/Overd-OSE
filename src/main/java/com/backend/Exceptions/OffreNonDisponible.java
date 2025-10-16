package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class OffreNonDisponible extends Exception {
    private final ErrorCode errorCode;

    public OffreNonDisponible() {
        super("L'offre n'est pas disponible");
        this.errorCode = ErrorCode.OFFER_NOT_FOUND;
    }
}
