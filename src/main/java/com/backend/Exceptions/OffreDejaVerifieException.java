package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class OffreDejaVerifieException extends Exception {
    private final ErrorCode errorCode;

    public OffreDejaVerifieException() {
        super("Offer already verified");
        this.errorCode = ErrorCode.OFFER_ALREADY_VERIFIED;
    }
}
