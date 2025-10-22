package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class EntenteDocumentNonTrouveeException extends Exception {
    private final ErrorCode errorCode;

    public EntenteDocumentNonTrouveeException() {
        super("Aucun document trouvé pour cette entente");
        this.errorCode = ErrorCode.ENTENTE_DOCUMENT_NON_TROUVE;
    }
}
