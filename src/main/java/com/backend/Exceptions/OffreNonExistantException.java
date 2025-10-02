package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class OffreNonExistantException extends Exception {
    private final ErrorCode errorCode;

    public OffreNonExistantException() {
        super("Offer not found");
        this.errorCode = ErrorCode.OFFER_NOT_FOUND;
    }
}
