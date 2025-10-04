package com.backend.service.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponseDTO {
    private String token;
    private UtilisateurDTO utilisateurDTO;
    private ErrorResponse errorResponse;

    public AuthResponseDTO(String token) {
        this.token = token;
    }
}

