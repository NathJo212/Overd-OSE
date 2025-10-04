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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
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

        AuthResponseDTO authResponse = new AuthResponseDTO(token, utilisateurDTO, null);

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

    @Test
    @DisplayName("POST /OSE/logout retourne 200 sur succès")
    void logout_success_returnsOk() throws Exception {
        String token = "jwt.token.here";
        // On ne vérifie pas la logique interne, juste l'appel
        doNothing().when(utilisateurService).logout(token);

        mockMvc.perform(post("/OSE/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Déconnexion réussie"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("POST /OSE/logout retourne 401 si token manquant")
    void logout_missingToken_returnsUnauthorized() throws Exception {
        mockMvc.perform(post("/OSE/logout"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erreur.message").value("Token manquant ou invalide"));
    }

    @Test
    @DisplayName("POST /OSE/logout retourne 401 si service échoue")
    void logout_serviceThrows_returnsUnauthorized() throws Exception {
        String token = "jwt.token.here";
        doThrow(new RuntimeException("Erreur")).when(utilisateurService).logout(token);

        mockMvc.perform(post("/OSE/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erreur.message").value("Erreur lors de la déconnexion"));
    }

    @Test
    @DisplayName("GET /OSE/getProgrammes retourne 200 et la liste des programmes")
    void getAllProgrammes_success_returnsOkAndList() throws Exception {
        // Arrange
        List<String> programmes = List.of(
                "180.A0 Soins infirmiers",
                "200.B1 Sciences de la nature",
                "410.A1 Gestion des opérations"
        );

        when(utilisateurService.getAllProgrammes()).thenReturn(programmes);

        // Act & Assert
        mockMvc.perform(get("/OSE/getProgrammes")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0]").value("180.A0 Soins infirmiers"))
                .andExpect(jsonPath("$[1]").value("200.B1 Sciences de la nature"))
                .andExpect(jsonPath("$[2]").value("410.A1 Gestion des opérations"));

        verify(utilisateurService, times(1)).getAllProgrammes();
    }

    @Test
    @DisplayName("GET /OSE/getProgrammes retourne 500 si le service lance une exception")
    void getAllProgrammes_serviceThrows_returnsServerError() throws Exception {
        // Arrange
        when(utilisateurService.getAllProgrammes()).thenThrow(new RuntimeException("Erreur interne"));

        // Act & Assert
        mockMvc.perform(get("/OSE/getProgrammes")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());

        verify(utilisateurService, times(1)).getAllProgrammes();
    }

}