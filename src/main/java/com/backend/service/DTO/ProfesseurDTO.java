package com.backend.service.DTO;

import com.backend.modele.Professeur;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

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
    private List<EtudiantDTO> etudiantList;

    public static ProfesseurDTO toDTO(Professeur prof) {
        if (prof == null) return null;
        return ProfesseurDTO.builder()
                .id(prof.getId())
                .email(prof.getEmail())
                .telephone(prof.getTelephone())
                .nom(prof.getNom())
                .prenom(prof.getPrenom())
                .etudiantList(prof.getEtudiantList() != null ?
                        prof.getEtudiantList().stream()
                                .map(e -> new EtudiantDTO().toDTO(e))
                                .collect(Collectors.toList()) : null)
                .build();
    }
}