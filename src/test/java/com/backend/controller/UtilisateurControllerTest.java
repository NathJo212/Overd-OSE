package com.backend.controller;

import com.backend.Exceptions.AuthenticationException;
import com.backend.service.DTO.AuthResponseDTO;
import com.backend.service.DTO.LoginDTO;
import com.backend.service.DTO.UtilisateurDTO;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@WebMvcTest(controllers = UtilisateurController.class)
@AutoConfigureMockMvc(addFilters = false)
class UtilisateurControllerTest {

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
    @DisplayName("POST /OSE/login retourne 200 et AuthResponseDTO sur succès")
    void login_success_returnsOkAndAuthResponse() throws Exception {
        // Arrange
        String email = "test@exemple.com";
        String password = "Password123!";
        String token = "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJ0ZXN0QGV4ZW1wbGUuY29tIn0.testToken";

        // Créer un objet LoginDTO
        LoginDTO loginDTO = new LoginDTO();
        loginDTO.setEmail(email);
        loginDTO.setPassword(password);

        UtilisateurDTO utilisateurDTO = new UtilisateurDTO();
        utilisateurDTO.setEmail(email);
        utilisateurDTO.setTelephone("5149749308");
        utilisateurDTO.setNomEntreprise("Test Entreprise");
        utilisateurDTO.setContact("Test Contact");

        AuthResponseDTO authResponse = new AuthResponseDTO(token, utilisateurDTO);

        when(utilisateurService.authentifierUtilisateur(email, password))
                .thenReturn(authResponse);

        // Act & Assert
        mockMvc.perform(post("/OSE/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginDTO))) // ← Utilisation d'ObjectMapper
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.token").value(token))
                .andExpect(jsonPath("$.utilisateurDTO.email").value(email))
                .andExpect(jsonPath("$.utilisateurDTO.telephone").value("5149749308"))
                .andExpect(jsonPath("$.utilisateurDTO.nomEntreprise").value("Test Entreprise"))
                .andExpect(jsonPath("$.utilisateurDTO.contact").value("Test Contact"));
    }

    @Test
    @DisplayName("POST /OSE/login retourne 401 si identifiants invalides")
    void login_invalidCredentials_returnsUnauthorized() throws Exception {
        // Arrange
        LoginDTO loginDTO = new LoginDTO();
        loginDTO.setEmail("test@exemple.com");
        loginDTO.setPassword("wrongPassword");

        doThrow(new AuthenticationException())
                .when(utilisateurService).authentifierUtilisateur(anyString(), anyString());

        // Act & Assert
        mockMvc.perform(post("/OSE/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginDTO)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /OSE/login retourne 401 si email inexistant")
    void login_emailInexistant_returnsUnauthorized() throws Exception {
        // Arrange
        LoginDTO loginDTO = new LoginDTO();
        loginDTO.setEmail("inexistant@exemple.com");
        loginDTO.setPassword("Password123!");

        doThrow(new AuthenticationException())
                .when(utilisateurService).authentifierUtilisateur(anyString(), anyString());

        // Act & Assert
        mockMvc.perform(post("/OSE/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginDTO)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /OSE/login retourne 401 si exception générale")
    void login_generalException_returnsUnauthorized() throws Exception {
        // Arrange
        doThrow(new RuntimeException("Erreur serveur"))
                .when(utilisateurService).authentifierUtilisateur(anyString(), anyString());

        String json = """
            {
                "email": "test@exemple.com",
                "password": "Password123!"
            }
        """;

        // Act & Assert
        mockMvc.perform(post("/OSE/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /OSE/login avec JSON malformé retourne 400")
    void login_malformedJson_returnsBadRequest() throws Exception {
        // Arrange
        String malformedJson = "{ email: test@exemple.com }"; // JSON invalide

        // Act & Assert
        mockMvc.perform(post("/OSE/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(malformedJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /OSE/login avec champs manquants")
    void login_missingFields_handledByService() throws Exception {
        // Arrange
        LoginDTO loginDTO = new LoginDTO();
        loginDTO.setEmail("");
        loginDTO.setPassword("");

        doThrow(new AuthenticationException())
                .when(utilisateurService).authentifierUtilisateur(anyString(), anyString());

        // Act & Assert
        mockMvc.perform(post("/OSE/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginDTO)))
                .andExpect(status().isUnauthorized());
    }
}