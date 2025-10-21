package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class EntenteDejaExistanteException extends Exception {
    private final ErrorCode errorCode;

    public EntenteDejaExistanteException() {
        super("Une entente existe déjà pour cet étudiant et cette offre");
        this.errorCode = ErrorCode.ENTENTE_ALREADY_EXISTS;
    }
}

