package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class CVDejaVerifieException extends Exception {
    private final ErrorCode errorCode;

    public CVDejaVerifieException() {
        super("Le CV a déjà été vérifié");
        this.errorCode = ErrorCode.CV_ALREADY_VERIFIED;
    }
}