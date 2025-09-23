package com.backend.service.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EtudiantDTO {

    private String email;
    private String password;
    private String telephone;
    private String nom;
    private String prenom;
    private String progEtude;
    private String session;
    private String annee;
}
