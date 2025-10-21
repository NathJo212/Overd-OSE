package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class EntenteModificationNonAutoriseeException extends Exception {
    private final ErrorCode errorCode;

    public EntenteModificationNonAutoriseeException() {
        super("La modification de cette entente n'est pas autorisée.");
        this.errorCode = ErrorCode.ENTENTE_MODIFICATION_NON_AUTORISEE;
    }
}
