package com.backend.service.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OffreDTO {
    private Long id;
    private AuthResponseDTO authResponseDTO;
    private String titre;
    private String description;
    private String date_debut;
    private String date_fin;
    private String progEtude;
    private String lieuStage;
    private String remuneration;
    private String dateLimite;
}
