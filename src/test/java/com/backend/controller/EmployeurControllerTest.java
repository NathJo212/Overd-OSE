package com.backend.controller;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.CandidatureNonTrouveeException;
import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.modele.Employeur;
import com.backend.service.DTO.AuthResponseDTO;
import com.backend.service.DTO.CandidatureDTO;
import com.backend.service.DTO.OffreDTO;
import com.backend.service.DTO.ProgrammeDTO;
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

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
        doThrow(new EmailDejaUtiliseException())
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
                .andExpect(jsonPath("$.erreur.message").value("Email already used"));
    }

    @Test
    @DisplayName("POST /OSEemployeur/creerCompte retourne 409 si mot de passe invalide")
    void creerCompte_motDePassePasBon_returnsConflict() throws Exception {
        doThrow(new MotPasseInvalideException())
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
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.message").value("Invalid password"));
    }

    @Test
    void creerOffre_success_returnsCreatedAndMessage() throws Exception {
        OffreDTO offreDTO = new OffreDTO();
        offreDTO.setAuthResponseDTO(new AuthResponseDTO("Bearer validToken"));
        offreDTO.setTitre("titre");
        offreDTO.setDescription("desc");
        offreDTO.setDate_debut(LocalDate.of(2024, 1, 1));
        offreDTO.setDate_fin(LocalDate.of(2024, 6, 1));
        offreDTO.setProgEtude(ProgrammeDTO.P420_B0);
        offreDTO.setLieuStage("lieu");
        offreDTO.setRemuneration("rem");
        offreDTO.setDateLimite(LocalDate.of(2024, 5, 1));

        mockMvc.perform(post("/OSEemployeur/creerOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(offreDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Offre de stage créée avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    void creerOffre_actionNonAutorisee_returnsConflict() throws Exception {
        doThrow(new ActionNonAutoriseeException())
                .when(employeurService).creerOffreDeStage(any(AuthResponseDTO.class), anyString(), anyString(), any(LocalDate.class), any(LocalDate.class), any(ProgrammeDTO.class), anyString(), anyString(), any(LocalDate.class));

        OffreDTO offreDTO = new OffreDTO();
        offreDTO.setAuthResponseDTO(new AuthResponseDTO("Bearer fakeToken"));
        offreDTO.setTitre("titre");
        offreDTO.setDescription("desc");
        offreDTO.setDate_debut(LocalDate.of(2024, 1, 1));
        offreDTO.setDate_fin(LocalDate.of(2024, 6, 1));
        offreDTO.setProgEtude(ProgrammeDTO.P200_B1);
        offreDTO.setLieuStage("lieu");
        offreDTO.setRemuneration("rem");
        offreDTO.setDateLimite(LocalDate.of(2024, 5, 1));

        mockMvc.perform(post("/OSEemployeur/creerOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(offreDTO)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.message").value("Unauthorized action"));
    }

    @Test
    @DisplayName("POST /OSEemployeur/OffresParEmployeur retourne 200 et liste d'offres avec employeur existant")
    void getAllOffresParEmployeur() throws Exception {
        // Arrange
        AuthResponseDTO authResponse = new AuthResponseDTO("Bearer validToken");

        OffreDTO offre1 = new OffreDTO();
        offre1.setId(1L);
        offre1.setTitre("Stage Développeur");
        offre1.setDescription("Stage en développement web");

        OffreDTO offre2 = new OffreDTO();
        offre2.setId(2L);
        offre2.setTitre("Stage Marketing");
        offre2.setDescription("Stage en marketing digital");

        when(employeurService.OffrePourEmployeur(any(AuthResponseDTO.class)))
                .thenReturn(java.util.List.of(offre1, offre2));

        // Act & Assert
        mockMvc.perform(post("/OSEemployeur/OffresParEmployeur")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authResponse)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].titre").value("Stage Développeur"))
                .andExpect(jsonPath("$[1].titre").value("Stage Marketing"));
    }

    @Test
    @DisplayName("POST /OSEemployeur/OffresParEmployeur retourne 401 si utilisateur non autorisé")
    void getAllOffresParEmployeur_nonEmployeur() throws Exception {
        // Arrange
        AuthResponseDTO authResponse = new AuthResponseDTO("Bearer fakeToken");

        doThrow(new ActionNonAutoriseeException())
                .when(employeurService).OffrePourEmployeur(any(AuthResponseDTO.class));

        // Act & Assert
        mockMvc.perform(post("/OSEemployeur/OffresParEmployeur")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authResponse)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /OSEemployeur/candidatures retourne 200 et liste de candidatures")
    void getAllCandidatures_success_returnsOkAndList() throws Exception {
        // Arrange
        CandidatureDTO candidature1 = new CandidatureDTO();
        candidature1.setId(1L);

        CandidatureDTO candidature2 = new CandidatureDTO();
        candidature2.setId(2L);

        when(employeurService.getCandidaturesPourEmployeur())
                .thenReturn(java.util.List.of(candidature1, candidature2));

        // Act & Assert
        mockMvc.perform(get("/OSEemployeur/candidatures")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    @DisplayName("GET /OSEemployeur/candidatures retourne 403 si non autorisé")
    void getAllCandidatures_nonAutorise_returnsForbidden() throws Exception {
        // Arrange
        doThrow(new ActionNonAutoriseeException())
                .when(employeurService).getCandidaturesPourEmployeur();

        // Act & Assert
        mockMvc.perform(get("/OSEemployeur/candidatures")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /OSEemployeur/candidatures retourne 500 sur erreur interne")
    void getAllCandidatures_internalError_returnsInternalServerError() throws Exception {
        // Arrange
        when(employeurService.getCandidaturesPourEmployeur())
                .thenThrow(new RuntimeException("Erreur interne"));

        // Act & Assert
        mockMvc.perform(get("/OSEemployeur/candidatures")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("GET /OSEemployeur/candidatures/{id} retourne 200 et candidature spécifique")
    void getCandidatureSpecifique_success_returnsOkAndCandidature() throws Exception {
        // Arrange
        Long candidatureId = 1L;
        CandidatureDTO candidature = new CandidatureDTO();
        candidature.setId(candidatureId);

        when(employeurService.getCandidatureSpecifique(candidatureId))
                .thenReturn(candidature);

        // Act & Assert
        mockMvc.perform(get("/OSEemployeur/candidatures/{id}", candidatureId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(candidatureId));
    }

    @Test
    @DisplayName("GET /OSEemployeur/candidatures/{id} retourne 403 si non autorisé")
    void getCandidatureSpecifique_nonAutorise_returnsForbidden() throws Exception {
        // Arrange
        Long candidatureId = 1L;
        doThrow(new ActionNonAutoriseeException())
                .when(employeurService).getCandidatureSpecifique(candidatureId);

        // Act & Assert
        mockMvc.perform(get("/OSEemployeur/candidatures/{id}", candidatureId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /OSEemployeur/candidatures/{id} retourne 404 si candidature non trouvée")
    void getCandidatureSpecifique_nonTrouvee_returnsNotFound() throws Exception {
        // Arrange
        Long candidatureId = 999L;
        doThrow(new CandidatureNonTrouveeException())
                .when(employeurService).getCandidatureSpecifique(candidatureId);

        // Act & Assert
        mockMvc.perform(get("/OSEemployeur/candidatures/{id}", candidatureId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /OSEemployeur/candidatures/{id} retourne 500 sur erreur interne")
    void getCandidatureSpecifique_internalError_returnsInternalServerError() throws Exception {
        // Arrange
        Long candidatureId = 1L;
        when(employeurService.getCandidatureSpecifique(candidatureId))
                .thenThrow(new RuntimeException("Erreur interne"));

        // Act & Assert
        mockMvc.perform(get("/OSEemployeur/candidatures/{id}", candidatureId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("GET /OSEemployeur/candidatures/{id}/cv retourne 200 et fichier PDF")
    void getCvCandidature_success_returnsOkAndPdf() throws Exception {
        // Arrange
        Long candidatureId = 1L;
        byte[] cvBytes = "CV Content".getBytes();

        when(employeurService.getCvPourCandidature(candidatureId))
                .thenReturn(cvBytes);

        // Act & Assert
        mockMvc.perform(get("/OSEemployeur/candidatures/{id}/cv", candidatureId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"cv.pdf\""))
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(content().bytes(cvBytes));
    }

    @Test
    @DisplayName("GET /OSEemployeur/candidatures/{id}/cv retourne 403 si non autorisé")
    void getCvCandidature_nonAutorise_returnsForbidden() throws Exception {
        // Arrange
        Long candidatureId = 1L;
        doThrow(new ActionNonAutoriseeException())
                .when(employeurService).getCvPourCandidature(candidatureId);

        // Act & Assert
        mockMvc.perform(get("/OSEemployeur/candidatures/{id}/cv", candidatureId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /OSEemployeur/candidatures/{id}/cv retourne 404 si candidature non trouvée")
    void getCvCandidature_candidatureNonTrouvee_returnsNotFound() throws Exception {
        // Arrange
        Long candidatureId = 999L;
        doThrow(new CandidatureNonTrouveeException())
                .when(employeurService).getCvPourCandidature(candidatureId);

        // Act & Assert
        mockMvc.perform(get("/OSEemployeur/candidatures/{id}/cv", candidatureId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /OSEemployeur/candidatures/{id}/cv retourne 500 sur erreur interne")
    void getCvCandidature_internalError_returnsInternalServerError() throws Exception {
        // Arrange
        Long candidatureId = 1L;
        when(employeurService.getCvPourCandidature(candidatureId))
                .thenThrow(new RuntimeException("Erreur interne"));

        // Act & Assert
        mockMvc.perform(get("/OSEemployeur/candidatures/{id}/cv", candidatureId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("GET /OSEemployeur/candidatures/{id}/lettre-motivation retourne 200 et fichier PDF")
    void getLettreMotivationCandidature_success_returnsOkAndPdf() throws Exception {
        // Arrange
        Long candidatureId = 1L;
        byte[] lettreBytes = "Lettre de motivation content".getBytes();

        when(employeurService.getLettreMotivationPourCandidature(candidatureId))
                .thenReturn(lettreBytes);

        // Act & Assert
        mockMvc.perform(get("/OSEemployeur/candidatures/{id}/lettre-motivation", candidatureId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"lettre-motivation.pdf\""))
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(content().bytes(lettreBytes));
    }

    @Test
    @DisplayName("GET /OSEemployeur/candidatures/{id}/lettre-motivation retourne 403 si non autorisé")
    void getLettreMotivationCandidature_nonAutorise_returnsForbidden() throws Exception {
        // Arrange
        Long candidatureId = 1L;
        doThrow(new ActionNonAutoriseeException())
                .when(employeurService).getLettreMotivationPourCandidature(candidatureId);

        // Act & Assert
        mockMvc.perform(get("/OSEemployeur/candidatures/{id}/lettre-motivation", candidatureId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /OSEemployeur/candidatures/{id}/lettre-motivation retourne 404 si candidature non trouvée")
    void getLettreMotivationCandidature_candidatureNonTrouvee_returnsNotFound() throws Exception {
        // Arrange
        Long candidatureId = 999L;
        doThrow(new CandidatureNonTrouveeException())
                .when(employeurService).getLettreMotivationPourCandidature(candidatureId);

        // Act & Assert
        mockMvc.perform(get("/OSEemployeur/candidatures/{id}/lettre-motivation", candidatureId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /OSEemployeur/candidatures/{id}/lettre-motivation retourne 500 sur erreur interne")
    void getLettreMotivationCandidature_internalError_returnsInternalServerError() throws Exception {
        // Arrange
        Long candidatureId = 1L;
        when(employeurService.getLettreMotivationPourCandidature(candidatureId))
                .thenThrow(new RuntimeException("Erreur interne"));

        // Act & Assert
        mockMvc.perform(get("/OSEemployeur/candidatures/{id}/lettre-motivation", candidatureId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }


}
