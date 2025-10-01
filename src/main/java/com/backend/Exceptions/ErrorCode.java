package com.backend.Exceptions;

import lombok.Getter;

/**
 * Codes d'erreur standardisés pour l'API
 * Ces codes sont utilisés par le frontend pour afficher les messages traduits
 */
@Getter
public enum ErrorCode {
    // Authentification
    AUTHENTICATION_FAILED("AUTH_001"),
    INVALID_JWT_TOKEN("AUTH_002"),
    USER_NOT_FOUND("AUTH_003"),

    // Validation
    EMAIL_ALREADY_USED("VALIDATION_001"),
    INVALID_PASSWORD("VALIDATION_002"),

    // Autorisations
    UNAUTHORIZED_ACTION("AUTHORIZATION_001"),

    // Offres
    OFFER_NOT_FOUND("OFFER_001"),
    OFFER_ALREADY_VERIFIED("OFFER_002"),

    // Général
    UNKNOWN_ERROR("ERROR_000");

    private final String code;

    ErrorCode(String code) {
        this.code = code;
    }
}