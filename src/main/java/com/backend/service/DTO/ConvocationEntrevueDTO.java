package com.backend.service.DTO;

import com.backend.modele.ConvocationEntrevue.StatutConvocation;
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
}