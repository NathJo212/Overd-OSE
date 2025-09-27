package com.backend.service;

import com.backend.Exceptions.AuthenticationException;
import com.backend.config.JwtTokenProvider;
import com.backend.modele.Utilisateur;
import com.backend.persistence.UtilisateurRepository;
import com.backend.service.DTO.AuthResponseDTO;
import com.backend.service.DTO.ProgrammeDTO;
import com.backend.service.DTO.UtilisateurDTO;
import jakarta.transaction.Transactional;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class UtilisateurService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UtilisateurRepository utilisateurRepository;

    public UtilisateurService(AuthenticationManager authenticationManager, JwtTokenProvider jwtTokenProvider, UtilisateurRepository utilisateurRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Transactional
    public AuthResponseDTO authentifierUtilisateur(String email, String password) {
        try {
            // Utilise Spring Security pour l'authentification
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );

            // Génère le token JWT
            String token = jwtTokenProvider.generateToken(authentication);

            // Récupère l'utilisateur pour créer le DTO
            Optional<Utilisateur> utilisateurOptional = utilisateurRepository.findByEmail(email);
            if (utilisateurOptional.isEmpty()) {
                throw new AuthenticationException();
            }

            Utilisateur utilisateur = utilisateurOptional.get();
            UtilisateurDTO utilisateurDTO = UtilisateurDTO.toDTO(utilisateur);

            return new AuthResponseDTO(token, utilisateurDTO);

        } catch (Exception e) {
            throw new AuthenticationException();
        }
    }

    @Transactional
    public void logout(String token) {
        jwtTokenProvider.logout(token);
    }

    @Transactional
    public Map<String, String> getAllProgrammes() {
        return List.of(ProgrammeDTO.values())
                .stream()
                .collect(Collectors.toMap(
                        ProgrammeDTO::name,   // key: enum name like P200_Z1
                        ProgrammeDTO::getLabel // value: the label
                ));
    }







}
