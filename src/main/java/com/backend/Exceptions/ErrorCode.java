package com.backend.Exceptions;

import lombok.Getter;

/**
 * Codes d'erreur standardisés pour l'API
 * Ces codes sont utilisés par le frontend pour afficher les messages traduits
 */
@Getter
public enum ErrorCode {
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
    OFFER_DATE_INVALID("OFFER_003"),

    // Candidature
    CANDIDATURE_NOT_FOUND("CAND_001"),
    CANDIDATURE_ALREADY_VERIFIED("CAND_002"),

    // Convocation
    CONVOCATION_DEJA_EXISTANTE("CONVO_001"),
    CONVOCATION_NON_TROUVE("CONVO_002"),

    // CV
    ERROR_UPLOAD_CV("CV_001"),
    CV_ALREADY_VERIFIED("CV_002"),
    CV_NOT_APPROVED("CV_003"),

    // Entente
    ENTENTE_ALREADY_EXISTS("ENT_001"),
    ENTENTE_NON_TROUVE("ENT_002"),
    ENTENTE_DOCUMENT_NON_TROUVE("ENT_003"),
    ENTENTE_MODIFICATION_NON_AUTORISEE("ENT_002"),
    ENTENTE_NOT_FOUND("ENT_002"),
    ENTENTE_STATUT_INVALID("ENT_003"),

    // Général
    UNKNOWN_ERROR("ERROR_000"),
    CANDIDATURE_NON_DISPONIBLE("CAND_001"),
    LETTRE_MOTIVATION_NON_DISPONIBLE("CAND_002"),
    STATUT_CANDIDATURE_INVALID("CAND_003");


    private final String code;

    ErrorCode(String code) {
        this.code = code;
    }
}