package com.backend.service.DTO;

import com.backend.modele.Employeur;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EmployeurDTO {
    private String email;
    private String password;
    private String telephone;
    private String nomEntreprise;
    private String contact;

    public EmployeurDTO toDTO(Employeur employeur) {
        EmployeurDTO dto = new EmployeurDTO();
        dto.setEmail(employeur.getEmail());
        dto.setTelephone(employeur.getTelephone());
        dto.setNomEntreprise(employeur.getNomEntreprise());
        dto.setContact(employeur.getContact());
        return dto;
    }
}
