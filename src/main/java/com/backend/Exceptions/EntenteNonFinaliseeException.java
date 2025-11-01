package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class EntenteNonFinaliseeException extends Exception {
    private final ErrorCode errorCode;

    public EntenteNonFinaliseeException() {
        super("L'entente n'est pas finalisée");
        this.errorCode = ErrorCode.ENTENTE_NON_FINALISEE;
    }
}