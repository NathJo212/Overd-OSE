package com.backend.Exceptions;

public class InvalidJwtTokenException extends RuntimeException {
    public InvalidJwtTokenException () {
        super("Jeton JWT invalide");
    }
}
