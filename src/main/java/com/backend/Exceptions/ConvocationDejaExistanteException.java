package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class ConvocationDejaExistanteException extends Exception {
    private final ErrorCode errorCode;

    public ConvocationDejaExistanteException() {
        super("Une convocation existe déjà pour cette candidature.");
        this.errorCode = ErrorCode.CONVOCATION_DEJA_EXISTANTE;
    }
}