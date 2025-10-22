package com.backend.service.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
public class ModificationEntenteDTO {
    String modificationEntente;

    public ModificationEntenteDTO(String modificationEntente) {
        this.modificationEntente = modificationEntente;
    }
}