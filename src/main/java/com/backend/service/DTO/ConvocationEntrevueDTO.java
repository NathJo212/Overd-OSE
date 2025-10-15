package com.backend.service.DTO;

import com.backend.modele.ConvocationEntrevue;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ConvocationEntrevueDTO {
    public Long candidatureId;
    public LocalDateTime dateHeure;
    public String lieuOuLien;
    public String message;
    public String statut;

    public ConvocationEntrevueDTO toDTO(ConvocationEntrevue convocation) {
        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        dto.candidatureId = convocation.getCandidature().getId();
        dto.dateHeure = convocation.getDateHeure();
        dto.lieuOuLien = convocation.getLieuOuLien();
        dto.message = convocation.getMessage();
        dto.statut = convocation.getStatut() != null ? convocation.getStatut().name() : null;
        return dto;
    }
}