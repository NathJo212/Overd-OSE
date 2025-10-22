package com.backend.service.DTO;

import lombok.Data;

@Data
public class ModificationEntenteDTO {
    String modificationEntente;

    public ModificationEntenteDTO(String modificationEntente) {
        this.modificationEntente = modificationEntente;
    }
}
