package com.backend.controller;

import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.service.DTO.ProgrammeDTO;
import com.backend.service.EtudiantService;
import com.backend.service.UtilisateurService;
import com.backend.service.DTO.EtudiantDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@WebMvcTest(controllers = EtudiantController.class)
@AutoConfigureMockMvc(addFilters = false)
class EtudiantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EtudiantService etudiantService;

    @MockitoBean
    private UtilisateurService utilisateurService;


    @Test
    @DisplayName("POST /OSEetudiant/creerCompte retourne 201 et message sur succès")
    void creerCompte_success_returnsCreatedAndMessage() throws Exception {
        // Arrange
        EtudiantDTO etudiant = new EtudiantDTO();
        etudiant.setEmail("etudiant@exemple.com");
        etudiant.setPassword("Etudiant12?");
        etudiant.setTelephone("(514) 582-9898");
        etudiant.setPrenom("Jean");
        etudiant.setNom("Dupont");
        etudiant.setProgEtude(ProgrammeDTO.P221_D0);
        etudiant.setSession("Automne");
        etudiant.setAnnee("2025");

        mockMvc.perform(post("/OSEetudiant/creerCompte")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(etudiant)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("Étudiant créé avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("POST /OSEetudiant/creerCompte retourne 409 si email déjà utilisé")
    void creerCompte_emailDejaUtilise_returnsConflict() throws Exception {
        doThrow(new EmailDejaUtiliseException())
                .when(etudiantService).creerEtudiant(anyString(), anyString(), anyString(), anyString(), anyString(), any(ProgrammeDTO.class), anyString(), anyString());

        EtudiantDTO etudiant = new EtudiantDTO();
        etudiant.setEmail("test@etudiant.com");
        etudiant.setPassword("Password1!");
        etudiant.setTelephone("1234567890");
        etudiant.setPrenom("Alice");
        etudiant.setNom("Martin");
        etudiant.setProgEtude(ProgrammeDTO.P388_A1);
        etudiant.setSession("Hiver");
        etudiant.setAnnee("2024");

        mockMvc.perform(post("/OSEetudiant/creerCompte")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(etudiant)))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur").value("Un étudiant avec cet email existe déjà"));
    }

    @Test
    @DisplayName("POST /OSEetudiant/creerCompte retourne 409 si mot de passe invalide")
    void creerCompte_motDePassePasBon_returnsConflict() throws Exception {
        doThrow(new MotPasseInvalideException())
                .when(etudiantService).creerEtudiant(anyString(), anyString(), anyString(), anyString(), anyString(), any(ProgrammeDTO.class), anyString(), anyString());

        EtudiantDTO etudiant = new EtudiantDTO();
        etudiant.setEmail("test@etudiant.com");
        etudiant.setPassword("abc");
        etudiant.setTelephone("1234567890");
        etudiant.setPrenom("Alice");
        etudiant.setNom("Martin");
        etudiant.setProgEtude(ProgrammeDTO.P300_A1_ADMIN);
        etudiant.setSession("Hiver");
        etudiant.setAnnee("2024");

        mockMvc.perform(post("/OSEetudiant/creerCompte")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(etudiant)))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur").value("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial."));
    }
}