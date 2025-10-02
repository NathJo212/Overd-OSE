package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class MotPasseInvalideException extends Exception {
    private final ErrorCode errorCode;

    public MotPasseInvalideException() {
        super("Invalid password");
        this.errorCode = ErrorCode.INVALID_PASSWORD;
    }



}
