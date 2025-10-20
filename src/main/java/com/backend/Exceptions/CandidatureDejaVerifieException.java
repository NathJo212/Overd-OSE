package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class CandidatureDejaVerifieException extends Exception {
    private final ErrorCode errorCode;

    public CandidatureDejaVerifieException() {
        super("Candidature already verified");
        this.errorCode = ErrorCode.CANDIDATURE_ALREADY_VERIFIED;
    }
}
