package com.backend.Exceptions;

import lombok.Getter;

@Getter
public class NotificationPasTrouveException extends Exception {
    private final ErrorCode errorCode;

    public NotificationPasTrouveException() {
        super("Notification non trouvée");
        this.errorCode = ErrorCode.NOTIFICATION_PAS_TROUVE;
    }
}

