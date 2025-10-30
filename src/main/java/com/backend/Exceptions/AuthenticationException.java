package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class AuthenticationException extends Exception {
    private final ErrorCode errorCode;

    public AuthenticationException() {
        super("Authentication failed");
        this.errorCode = ErrorCode.AUTHENTICATION_FAILED;
    }

}