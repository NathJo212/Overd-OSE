package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class EvaluationDejaExistanteException extends Exception {
    private final ErrorCode errorCode;

    public EvaluationDejaExistanteException() {
        super("Evaluation deja existante");
        this.errorCode = ErrorCode.EVALUATION_DEJA_EXISTANTE;
    }
}