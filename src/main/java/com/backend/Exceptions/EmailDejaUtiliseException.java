package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class EmailDejaUtiliseException extends Exception {
    private final ErrorCode errorCode;

    public EmailDejaUtiliseException() {
        super("Email already used");
        this.errorCode = ErrorCode.EMAIL_ALREADY_USED;
    }
}
