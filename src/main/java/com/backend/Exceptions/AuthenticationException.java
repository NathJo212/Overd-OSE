package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class AuthenticationException extends RuntimeException {
    private final ErrorCode errorCode;

    public AuthenticationException() {
        super("Authentication failed");
        this.errorCode = ErrorCode.AUTHENTICATION_FAILED;
    }

}