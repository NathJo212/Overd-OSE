package com.backend.service.DTO;

import com.backend.modele.Professeur;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfesseurDTO {
    private Long id;
    private String email;
    private String telephone;
    private String nom;
    private String prenom;

    public static ProfesseurDTO toDTO(Professeur prof) {
        if (prof == null) return null;
        return ProfesseurDTO.builder()
                .id(prof.getId())
                .email(prof.getEmail())
                .telephone(prof.getTelephone())
                .nom(prof.getNom())
                .prenom(prof.getPrenom())
                .build();
    }
}
