package com.backend.service.DTO;

import java.time.LocalDateTime;

import com.backend.modele.Notification;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private String messageKey;
    private String messageParam;
    private boolean lu;
    private LocalDateTime dateCreation;

    public Object toDTO(Notification notification) {
        return new NotificationDTO(
            notification.getId(),
            notification.getMessageKey(),
            notification.getMessageParam(),
            notification.isLu(),
            notification.getDateCreation()
        );
    }
}
