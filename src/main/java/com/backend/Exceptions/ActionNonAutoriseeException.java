package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class ActionNonAutoriseeException extends Exception {
    private final ErrorCode errorCode;

    public ActionNonAutoriseeException() {
        super("Unauthorized action");
        this.errorCode = ErrorCode.UNAUTHORIZED_ACTION;
    }
}
