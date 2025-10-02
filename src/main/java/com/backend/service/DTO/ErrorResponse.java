package com.backend.service.DTO;

import lombok.Getter;
import lombok.Setter;

/**
 * DTO pour les réponses d'erreur avec code d'erreur standardisé
 */
@Getter
@Setter
public class ErrorResponse {
    private String errorCode;  // Code d'erreur standardisé (ex: "AUTH_001")
    private String message;     // Message optionnel pour le debug

    public ErrorResponse(String errorCode, String message) {
        this.errorCode = errorCode;
        this.message = message;
    }

}