package com.backend.controller;

import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.modele.Employeur;
import com.backend.service.EmployeurService;
import com.backend.service.EtudiantService;
import com.backend.service.UtilisateurService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@WebMvcTest(controllers = EmployeurController.class)
@AutoConfigureMockMvc(addFilters = false)
class EmployeurControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EmployeurService employeurService;

    @MockitoBean
    private EtudiantService etudiantService;

    @MockitoBean
    private UtilisateurService utilisateurService;

    @MockitoBean
    private AuthenticationManager authenticationManager;

    @Test
    @DisplayName("POST /OSEemployeur/creerCompte retourne 201 et message sur succès")
    void creerCompte_success_returnsCreatedAndMessage() throws Exception {
        // Arrange
        Employeur employeur = new Employeur("mon@employeur.com","Etudiant12?","(514) 582-9898","Gogole","Jaques L'heureux");

        mockMvc.perform(post("/OSEemployeur/creerCompte")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(employeur)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("Employeur créé avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("POST /OSEemployeur/creerCompte retourne 409 si email déjà utilisé")
    void creerCompte_emailDejaUtilise_returnsConflict() throws Exception {
        doThrow(new EmailDejaUtiliseException("Un employeur avec cet email existe déjà"))
                .when(employeurService).creerEmployeur(anyString(), anyString(), anyString(), anyString(), anyString());

        String json = """
            {
                "email": "test@employeur.com",
                "password": "Password1!",
                "telephone": "1234567890",
                "nomEntreprise": "Entreprise",
                "contact": "Contact"
            }
        """;

        mockMvc.perform(post("/OSEemployeur/creerCompte")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur").value("Un employeur avec cet email existe déjà"));
    }

    @Test
    @DisplayName("POST /OSEemployeur/creerCompte retourne 409 si mot de passe invalide")
    void creerCompte_motDePassePasBon_returnsConflict() throws Exception {
        doThrow(new EmailDejaUtiliseException("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial."))
                .when(employeurService).creerEmployeur(anyString(), anyString(), anyString(), anyString(), anyString());

        String json = """
            {
                "email": "test@employeur.com",
                "password": "abc",
                "telephone": "1234567890",
                "nomEntreprise": "Entreprise",
                "contact": "Contact"
            }
        """;

        mockMvc.perform(post("/OSEemployeur/creerCompte")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur").value("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial."));
    }
}
