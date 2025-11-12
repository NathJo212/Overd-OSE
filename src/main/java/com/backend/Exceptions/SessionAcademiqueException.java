package com.backend.Exceptions;

public class SessionAcademiqueException extends Exception {

    private final ErrorCode errorCode;

    public SessionAcademiqueException() {
        super("Erreur lors de la gestion de la session académique");
        this.errorCode = ErrorCode.UNKNOWN_ERROR;
    }

    public SessionAcademiqueException(String message) {
        super(message);
        this.errorCode = ErrorCode.UNKNOWN_ERROR;
    }

    public SessionAcademiqueException(String message, ErrorCode errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}