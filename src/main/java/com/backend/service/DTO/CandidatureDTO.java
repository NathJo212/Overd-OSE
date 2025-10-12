package com.backend.service.DTO;

import com.backend.modele.Candidature;
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
    private LocalDateTime dateCandidature;
    private String statut;
    private boolean aCv;
    private boolean aLettreMotivation;
    private String messageReponse;

    public CandidatureDTO toDTO(Candidature candidature) {
        this.id = candidature.getId();
        this.offreId = candidature.getOffre().getId();
        this.offreTitre = candidature.getOffre().getTitre();
        this.employeurNom = candidature.getOffre().getEmployeur().getContact();
        this.dateCandidature = candidature.getDateCandidature();
        this.statut = candidature.getStatut().name();
        this.aCv = candidature.getEtudiant().getCv() != null && candidature.getEtudiant().getCv().length > 0;
        this.aLettreMotivation = candidature.getLettreMotivation() != null && candidature.getLettreMotivation().length > 0;
        this.messageReponse = candidature.getMessageReponse();
        return this;
    }
}