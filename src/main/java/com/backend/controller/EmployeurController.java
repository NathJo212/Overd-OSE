package com.backend.controller;

import com.backend.service.DTO.AuthResponseDTO;
import com.backend.service.DTO.EmployeurDTO;
import com.backend.service.DTO.MessageRetourDTO;
import com.backend.service.EmployeurService;
import com.backend.config.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/OSEemployeur")
public class EmployeurController {

    private final EmployeurService employeurService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public EmployeurController(EmployeurService employeurService,
                               AuthenticationManager authenticationManager,
                               JwtService jwtService) {
        this.employeurService = employeurService;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @PostMapping("/creerCompte")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> creerCompte(@RequestBody EmployeurDTO employeurDTO) {
        employeurService.creerEmployeur(employeurDTO.getEmail(), employeurDTO.getPassword(),
                employeurDTO.getTelephone(), employeurDTO.getNomEntreprise(),
                employeurDTO.getContact());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MessageRetourDTO("Employeur créé avec succès", null));
    }

    @PostMapping("/connexion")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody EmployeurDTO request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String token = jwtService.generateToken(authentication);

        AuthResponseDTO response = new AuthResponseDTO(
                token,
                new EmployeurDTO(request.getEmail(), null, null, null, null)
        );

        return ResponseEntity.ok(response);
    }
}