package com.backend.service.DTO;

import com.backend.modele.Etudiant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EtudiantDTO {

    private Long id;
    private String email;
    private String password;
    private String telephone;
    private String nom;
    private String prenom;
    private ProgrammeDTO progEtude;
//    private String session;
    private String annee;
    private byte[] cv;
    private String statutCV;
    private String messageRefusCV;
    private ProfesseurDTO professeur;

    public EtudiantDTO toDTO(Etudiant etudiant) {
        EtudiantDTO dto = new EtudiantDTO();
        dto.setId(etudiant.getId());
        dto.setEmail(etudiant.getEmail());
        dto.setPassword(etudiant.getPassword());
        dto.setTelephone(etudiant.getTelephone());
        dto.setNom(etudiant.getNom());
        dto.setPrenom(etudiant.getPrenom());

        if (etudiant.getProgEtude() != null) {
            dto.setProgEtude(ProgrammeDTO.toDTO(etudiant.getProgEtude()));
        }

//        dto.setSession(etudiant.getSession());
        dto.setAnnee(etudiant.getAnnee());
        dto.setCv(etudiant.getCv());

        if (etudiant.getStatutCV() != null) {
            dto.setStatutCV(etudiant.getStatutCV().name());
        }

        dto.setMessageRefusCV(etudiant.getMessageRefusCV());

        if (etudiant.getProfesseur() != null) {
            dto.setProfesseur(ProfesseurDTO.toDTO(etudiant.getProfesseur()));
        }

        return dto;
    }
}