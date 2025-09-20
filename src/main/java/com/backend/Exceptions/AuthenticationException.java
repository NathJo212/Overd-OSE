package com.backend.Exceptions;

public class AuthenticationException extends RuntimeException {
    public AuthenticationException() {
        super("Échec de l'authentification");
    }
}
