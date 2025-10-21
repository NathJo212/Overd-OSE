package com.backend.service.DTO;

import com.backend.modele.Candidature;
import com.backend.modele.ConvocationEntrevue;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CandidatureDTO {
    private Long id;
    private Long offreId;
    private String offreTitre;
    private String employeurNom;
    private Long etudiantId;
    private String etudiantNom;
    private String etudiantPrenom;
    private String etudiantEmail;
    private LocalDateTime dateCandidature;
    private String statut;
    private boolean aCv;
    private boolean aLettreMotivation;
    private String messageReponse;

    private ConvocationEntrevueDTO convocation;

    public CandidatureDTO toDTO(Candidature candidature) {
        this.id = candidature.getId();
        this.offreId = candidature.getOffre().getId();
        this.offreTitre = candidature.getOffre().getTitre();
        this.employeurNom = candidature.getOffre().getEmployeur().getContact();

        this.etudiantId = candidature.getEtudiant().getId();
        this.etudiantNom = candidature.getEtudiant().getNom();
        this.etudiantPrenom = candidature.getEtudiant().getPrenom();
        this.etudiantEmail = candidature.getEtudiant().getEmail();

        this.dateCandidature = candidature.getDateCandidature();
        this.statut = candidature.getStatut().name();
        this.aCv = candidature.getEtudiant().getCv() != null && candidature.getEtudiant().getCv().length > 0;
        this.aLettreMotivation = candidature.getLettreMotivation() != null && candidature.getLettreMotivation().length > 0;
        this.messageReponse = candidature.getMessageReponse();

        try {
            ConvocationEntrevue conv = candidature.getConvocationEntrevue();
            if (conv != null) {
                ConvocationEntrevueDTO convDto = new ConvocationEntrevueDTO();
                convDto.setCandidatureId(conv.getId());
                convDto.setDateHeure(conv.getDateHeure());
                convDto.setLieuOuLien(conv.getLieuOuLien());
                convDto.setMessage(conv.getMessage());
                convDto.setStatut(conv.getStatut() != null ? conv.getStatut().name() : null);
                this.convocation = convDto;
            } else {
                this.convocation = null;
            }
        } catch (Exception e) {
            this.convocation = null;
        }

        return this;
    }
}
