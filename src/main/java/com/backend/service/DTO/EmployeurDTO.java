package com.backend.service.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class EmployeurDTO {
    private String email;
    private String password;
    private String telephone;
    private String nomEntreprise;
    private String contact;
}
