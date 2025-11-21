package com.backend.service.DTO;

import lombok.Data;

@Data
public class DocumentsEntenteDTO {
    private byte[] contractEntentepdf;
    private byte[] evaluationStagiairepdf;
    private byte[] evaluationMilieuStagepdf;
}
