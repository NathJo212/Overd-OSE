package com.backend.Exceptions;
import lombok.Getter;

@Getter
public class CvNonApprouveException extends Exception {
    private final ErrorCode errorCode;

    public CvNonApprouveException() {
        super("Le CV n'a pas été approuvé");
        this.errorCode = ErrorCode.CV_NOT_APPROVED;
    }
}
