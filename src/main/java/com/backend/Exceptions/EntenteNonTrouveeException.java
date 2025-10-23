package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class EntenteNonTrouveeException extends RuntimeException {

    private final ErrorCode errorCode;
    public EntenteNonTrouveeException() {
        super("Entente non trouvee");
        this.errorCode = ErrorCode.ENTENTE_NON_TROUVE;
    }
}
