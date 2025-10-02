package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class UserNotFoundException extends RuntimeException {
    private final ErrorCode errorCode;

    public UserNotFoundException() {
        super("User not found");
        this.errorCode = ErrorCode.USER_NOT_FOUND;
    }

}
