package com.backend.controller;

import com.backend.service.DTO.EmployeurDTO;
import com.backend.service.DTO.MessageRetourDTO;
import com.backend.service.EmployeurService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/OSEemployeur")
public class EmployeurController {

    private final EmployeurService employeurService;

    public EmployeurController(EmployeurService employeurService) {
        this.employeurService = employeurService;
    }

    @PostMapping("/creerCompte")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO>  creerCompte(@RequestBody EmployeurDTO employeurDTO) {
        employeurService.creerEmployeur(employeurDTO.getEmail(), employeurDTO.getPassword(), employeurDTO.getTelephone(), employeurDTO.getNomEntreprise(), employeurDTO.getContact());
        return ResponseEntity.status(HttpStatus.CREATED).body(new MessageRetourDTO("Employeur créer avec succès", null));
    }
}
