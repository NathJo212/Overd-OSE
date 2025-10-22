package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class EntenteNonTrouveException extends Exception {
    private final ErrorCode errorCode;

    public EntenteNonTrouveException() {
        super("Entente non trouvée");
        this.errorCode = ErrorCode.ENTENTE_NON_TROUVE;
    }
}
