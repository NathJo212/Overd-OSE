package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class InvalidJwtTokenException extends RuntimeException {
    private final ErrorCode errorCode;

    public InvalidJwtTokenException() {
        super("Invalid JWT token");
        this.errorCode = ErrorCode.INVALID_JWT_TOKEN;
    }

}
