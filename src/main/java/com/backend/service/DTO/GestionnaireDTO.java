package com.backend.service.DTO;

import com.backend.modele.GestionnaireStage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class GestionnaireDTO {
    private Long id;
    private String email;
    private String telephone;
    private String nom;
    private String prenom;

    public static GestionnaireDTO toDTO(GestionnaireStage gestionnaire) {
        if (gestionnaire == null) return null;
        return GestionnaireDTO.builder()
                .id(gestionnaire.getId())
                .email(gestionnaire.getEmail())
                .telephone(gestionnaire.getTelephone())
                .nom(gestionnaire.getNom())
                .prenom(gestionnaire.getPrenom())
                .build();
    }
}