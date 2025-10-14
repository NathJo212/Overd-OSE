package com.backend.service.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
class CandidatureRequestDTO {
    private Long offreId;
    private String lettreMotivation;
}