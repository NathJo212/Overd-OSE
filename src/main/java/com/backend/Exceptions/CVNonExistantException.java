package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class CVNonExistantException extends RuntimeException {
    private final ErrorCode errorCode;

    public CVNonExistantException() {
        super("CV non trouvé ou n'existe pas");
        this.errorCode = ErrorCode.ERROR_UPLOAD_CV;
    }

    public CVNonExistantException(String message) {
        super(message);
        this.errorCode = ErrorCode.ERROR_UPLOAD_CV;
    }
}