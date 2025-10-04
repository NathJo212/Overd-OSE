package com.backend.service.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MessageRetourDTO {
    private String message;
    private ErrorResponse erreur;
}