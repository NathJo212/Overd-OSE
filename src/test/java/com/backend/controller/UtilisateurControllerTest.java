package com.backend.controller;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.AuthenticationException;
import com.backend.Exceptions.UtilisateurPasTrouveException;
import com.backend.service.DTO.*;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    @Test
    @DisplayName("GET /OSE/search retourne 200 et les résultats pour category=ALL")
    void search_withAllCategory_returnsOkAndResults() throws Exception {
        // Arrange
        Map<String, Object> results = new HashMap<>();
        results.put("etudiants", List.of());
        results.put("employeurs", List.of());
        results.put("professeurs", List.of());
        results.put("gestionnaires", List.of());

        when(utilisateurService.searchUsersByCategory("test", "ALL"))
                .thenReturn(results);

        // Act & Assert
        mockMvc.perform(get("/OSE/search")
                        .param("q", "test")
                        .param("category", "ALL")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.etudiants").isArray())
                .andExpect(jsonPath("$.employeurs").isArray())
                .andExpect(jsonPath("$.professeurs").isArray())
                .andExpect(jsonPath("$.gestionnaires").isArray());

        verify(utilisateurService, times(1)).searchUsersByCategory("test", "ALL");
    }

    @Test
    @DisplayName("GET /OSE/search retourne 200 pour category=ETUDIANT")
    void search_withEtudiantCategory_returnsOkAndResults() throws Exception {
        // Arrange
        Map<String, Object> results = new HashMap<>();
        results.put("etudiants", List.of());

        when(utilisateurService.searchUsersByCategory("jean", "ETUDIANT"))
                .thenReturn(results);

        // Act & Assert
        mockMvc.perform(get("/OSE/search")
                        .param("q", "jean")
                        .param("category", "ETUDIANT")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.etudiants").isArray());

        verify(utilisateurService, times(1)).searchUsersByCategory("jean", "ETUDIANT");
    }

    @Test
    @DisplayName("GET /OSE/search retourne 403 si ActionNonAutoriseeException")
    void search_whenUnauthorized_returnsForbidden() throws Exception {
        // Arrange
        when(utilisateurService.searchUsersByCategory(anyString(), anyString()))
                .thenThrow(new ActionNonAutoriseeException());

        // Act & Assert
        mockMvc.perform(get("/OSE/search")
                        .param("q", "test")
                        .param("category", "ALL")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        verify(utilisateurService, times(1)).searchUsersByCategory("test", "ALL");
    }

    @Test
    @DisplayName("GET /OSE/search retourne 400 si category invalide")
    void search_withInvalidCategory_returnsBadRequest() throws Exception {
        // Arrange
        when(utilisateurService.searchUsersByCategory("test", "INVALID"))
                .thenThrow(new IllegalArgumentException("Invalid category"));

        // Act & Assert
        mockMvc.perform(get("/OSE/search")
                        .param("q", "test")
                        .param("category", "INVALID")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        verify(utilisateurService, times(1)).searchUsersByCategory("test", "INVALID");
    }

    @Test
    @DisplayName("GET /OSE/search sans searchTerm retourne tous les résultats")
    void search_withoutSearchTerm_returnsAllResults() throws Exception {
        // Arrange
        Map<String, Object> results = new HashMap<>();
        results.put("etudiants", List.of());
        results.put("employeurs", List.of());
        results.put("professeurs", List.of());
        results.put("gestionnaires", List.of());

        when(utilisateurService.searchUsersByCategory(null, "ALL"))
                .thenReturn(results);

        // Act & Assert
        mockMvc.perform(get("/OSE/search")
                        .param("category", "ALL")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(utilisateurService, times(1)).searchUsersByCategory(null, "ALL");
    }

    @Test
    @DisplayName("GET /OSE/info/etudiant/{id} retourne 200 et EtudiantDTO")
    void getEtudiantInfo_success_returnsOkAndDTO() throws Exception {
        // Arrange
        EtudiantDTO etudiantDTO = new EtudiantDTO();
        etudiantDTO.setId(1L);
        etudiantDTO.setEmail("etudiant@test.com");
        etudiantDTO.setNom("Dupont");
        etudiantDTO.setPrenom("Jean");

        when(utilisateurService.getEtudiantInfo(1L)).thenReturn(etudiantDTO);

        // Act & Assert
        mockMvc.perform(get("/OSE/info/etudiant/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("etudiant@test.com"))
                .andExpect(jsonPath("$.nom").value("Dupont"))
                .andExpect(jsonPath("$.prenom").value("Jean"));

        verify(utilisateurService, times(1)).getEtudiantInfo(1L);
    }

    @Test
    @DisplayName("GET /OSE/info/etudiant/{id} retourne 404 si non trouvé")
    void getEtudiantInfo_notFound_returnsNotFound() throws Exception {
        // Arrange
        when(utilisateurService.getEtudiantInfo(99L))
                .thenThrow(new UtilisateurPasTrouveException());

        // Act & Assert
        mockMvc.perform(get("/OSE/info/etudiant/99")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        verify(utilisateurService, times(1)).getEtudiantInfo(99L);
    }

    @Test
    @DisplayName("GET /OSE/info/etudiant/{id} retourne 403 si non autorisé")
    void getEtudiantInfo_unauthorized_returnsForbidden() throws Exception {
        // Arrange
        when(utilisateurService.getEtudiantInfo(1L))
                .thenThrow(new ActionNonAutoriseeException());

        // Act & Assert
        mockMvc.perform(get("/OSE/info/etudiant/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        verify(utilisateurService, times(1)).getEtudiantInfo(1L);
    }

    @Test
    @DisplayName("GET /OSE/info/employeur/{id} retourne 200 et EmployeurDTO")
    void getEmployeurInfo_success_returnsOkAndDTO() throws Exception {
        // Arrange
        EmployeurDTO employeurDTO = new EmployeurDTO();
        employeurDTO.setId(1L);
        employeurDTO.setEmail("employeur@test.com");
        employeurDTO.setNomEntreprise("Google");

        when(utilisateurService.getEmployeurInfo(1L)).thenReturn(employeurDTO);

        // Act & Assert
        mockMvc.perform(get("/OSE/info/employeur/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("employeur@test.com"))
                .andExpect(jsonPath("$.nomEntreprise").value("Google"));

        verify(utilisateurService, times(1)).getEmployeurInfo(1L);
    }

    @Test
    @DisplayName("GET /OSE/info/professeur/{id} retourne 200 et ProfesseurDTO")
    void getProfesseurInfo_success_returnsOkAndDTO() throws Exception {
        // Arrange
        ProfesseurDTO professeurDTO = new ProfesseurDTO();
        professeurDTO.setId(1L);
        professeurDTO.setEmail("prof@test.com");
        professeurDTO.setNom("Dupont");
        professeurDTO.setPrenom("Pierre");

        when(utilisateurService.getProfesseurInfo(1L)).thenReturn(professeurDTO);

        // Act & Assert
        mockMvc.perform(get("/OSE/info/professeur/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("prof@test.com"))
                .andExpect(jsonPath("$.nom").value("Dupont"));

        verify(utilisateurService, times(1)).getProfesseurInfo(1L);
    }

    @Test
    @DisplayName("GET /OSE/info/gestionnaire/{id} retourne 200 et GestionnaireDTO")
    void getGestionnaireInfo_success_returnsOkAndDTO() throws Exception {
        // Arrange
        GestionnaireDTO gestionnaireDTO = new GestionnaireDTO();
        gestionnaireDTO.setId(1L);
        gestionnaireDTO.setEmail("gest@test.com");
        gestionnaireDTO.setNom("Martin");
        gestionnaireDTO.setPrenom("Claire");

        when(utilisateurService.getGestionnaireInfo(1L)).thenReturn(gestionnaireDTO);

        // Act & Assert
        mockMvc.perform(get("/OSE/info/gestionnaire/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("gest@test.com"))
                .andExpect(jsonPath("$.nom").value("Martin"));

        verify(utilisateurService, times(1)).getGestionnaireInfo(1L);
    }

}