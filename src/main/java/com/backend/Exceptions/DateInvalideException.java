package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class DateInvalideException extends RuntimeException {
    private final ErrorCode errorCode;

    public DateInvalideException() {
        super("Invalid date provided");
        this.errorCode = ErrorCode.OFFER_DATE_INVALID;
    }

    public DateInvalideException(String message) {
        super(message);
        this.errorCode = ErrorCode.OFFER_DATE_INVALID;
    }
}
