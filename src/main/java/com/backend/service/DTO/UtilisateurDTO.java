package com.backend.service.DTO;

import com.backend.modele.Employeur;
import com.backend.modele.Etudiant;
import com.backend.modele.Utilisateur;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class UtilisateurDTO {

    private String email;
    private String password;
    private String telephone;

    private String nomEntreprise;
    private String contact;

    private String nom;
    private String prenom;
    private ProgrammeDTO progEtude;
    private String session;
    private String annee;

    public static UtilisateurDTO toDTO(Utilisateur utilisateur) {
        UtilisateurDTO dto = new UtilisateurDTO();
        dto.email = utilisateur.getEmail();
        dto.password = utilisateur.getPassword();
        dto.telephone = utilisateur.getTelephone();

        switch(utilisateur) {
            case Employeur employeur -> {
                dto.setNomEntreprise(employeur.getNomEntreprise());
                dto.setContact(employeur.getContact());
            }
            case Etudiant etudiant -> {
                dto.setNom(etudiant.getNom());
                dto.setPrenom(etudiant.getPrenom());
                dto.setProgEtude(ProgrammeDTO.toDTO(etudiant.getProgEtude()));
                dto.setSession(etudiant.getSession());
                dto.setAnnee(etudiant.getAnnee());
            }
            default -> {
            }
        }
        return dto;
    }

}
