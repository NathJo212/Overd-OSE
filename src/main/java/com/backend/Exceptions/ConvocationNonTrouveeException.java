package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class ConvocationNonTrouveeException extends Exception {
    private final ErrorCode errorCode;

    public ConvocationNonTrouveeException() {
        super("Aucune convocation trouvée pour cette candidature.");
        this.errorCode = ErrorCode.CONVOCATION_NON_TROUVE;
    }
}