package com.backend.controller;

import com.backend.Exceptions.*;
import com.backend.modele.Employeur;
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

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
    @DisplayName("POST /OSEemployeur/creerOffre retourne 400 si dates invalides")
    void creerOffre_dateInvalide_returnsBadRequest() throws Exception {
        doThrow(new DateInvalideException())
                .when(employeurService).creerOffreDeStage(any(AuthResponseDTO.class), anyString(), anyString(), any(LocalDate.class), any(LocalDate.class), any(ProgrammeDTO.class), anyString(), anyString(), any(LocalDate.class));

        OffreDTO offreDTO = new OffreDTO();
        offreDTO.setAuthResponseDTO(new AuthResponseDTO("Bearer validToken"));
        offreDTO.setTitre("titre");
        offreDTO.setDescription("desc");
        offreDTO.setDate_debut(LocalDate.of(2024, 6, 1));
        offreDTO.setDate_fin(LocalDate.of(2024, 1, 1));
        offreDTO.setProgEtude(ProgrammeDTO.P420_B0);
        offreDTO.setLieuStage("lieu");
        offreDTO.setRemuneration("rem");
        offreDTO.setDateLimite(LocalDate.of(2024, 5, 1));

        mockMvc.perform(post("/OSEemployeur/creerOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(offreDTO)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.message").value("Invalid date provided"));
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

    @Test
    @DisplayName("POST /OSEemployeur/creerConvocation retourne 201 sur succès")
    void creerConvocation_success_returnsCreated() throws Exception {
        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        dto.setCandidatureId(1L);
        dto.setDateHeure(LocalDateTime.now().plusDays(5));
        dto.setLieuOuLien("Salle 302");
        dto.setMessage("Test message");

        mockMvc.perform(post("/OSEemployeur/creerConvocation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Convocation créée avec succès"))
                .andExpect(jsonPath("$.errorResponse").doesNotExist());
    }

    @Test
    @DisplayName("POST /OSEemployeur/creerConvocation retourne 404 si candidature non trouvée")
    void creerConvocation_candidatureNonTrouvee_returnsNotFound() throws Exception {
        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        dto.setCandidatureId(999L);
        dto.setDateHeure(LocalDateTime.now().plusDays(5));
        dto.setLieuOuLien("Salle 302");
        dto.setMessage("Test message");

        doThrow(new CandidatureNonTrouveeException()).when(employeurService).creerConvocation(any(ConvocationEntrevueDTO.class));

        mockMvc.perform(post("/OSEemployeur/creerConvocation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value("CANDIDATURE_NOT_FOUND"));
    }

    @Test
    @DisplayName("POST /OSEemployeur/creerConvocation retourne 409 si convocation déjà existante")
    void creerConvocation_convocationDejaExistante_returnsConflict() throws Exception {
        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        dto.setCandidatureId(1L);
        dto.setDateHeure(LocalDateTime.now().plusDays(5));
        dto.setLieuOuLien("Salle 302");
        dto.setMessage("Test message");

        doThrow(new ConvocationDejaExistanteException()).when(employeurService).creerConvocation(any(ConvocationEntrevueDTO.class));

        mockMvc.perform(post("/OSEemployeur/creerConvocation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value("CONVOCATION_EXISTS"));
    }

    @Test
    @DisplayName("POST /OSEemployeur/creerConvocation retourne 500 sur erreur interne")
    void creerConvocation_internalError_returnsInternalServerError() throws Exception {
        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        dto.setCandidatureId(1L);
        dto.setDateHeure(LocalDateTime.now().plusDays(5));
        dto.setLieuOuLien("Salle 302");
        dto.setMessage("Test message");

        doThrow(new RuntimeException("Erreur interne")).when(employeurService).creerConvocation(any(ConvocationEntrevueDTO.class));

        mockMvc.perform(post("/OSEemployeur/creerConvocation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value("INTERNAL_ERROR"));
    }

    @Test
    @DisplayName("PUT /OSEemployeur/candidatures/convocation retourne 200 sur succès")
    void modifierConvocation_success_returnsOk() throws Exception {
        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        mockMvc.perform(put("/OSEemployeur/candidatures/convocation")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Convocation modifiée avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("PUT /OSEemployeur/candidatures/convocation retourne 404 si candidature non trouvée")
    void modifierConvocation_candidatureNonTrouvee_returnsNotFound() throws Exception {
        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        doThrow(new CandidatureNonTrouveeException()).when(employeurService).modifierConvocation(any(ConvocationEntrevueDTO.class));
        mockMvc.perform(put("/OSEemployeur/candidatures/convocation")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value("CANDIDATURE_NOT_FOUND"));
    }

    @Test
    @DisplayName("PUT /OSEemployeur/candidatures/{id}/convocation/annuler retourne 200 sur succès")
    void annulerConvocation_success_returnsOk() throws Exception {
        Long candidatureId = 1L;
        mockMvc.perform(put("/OSEemployeur/candidatures/{id}/convocation/annuler", candidatureId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Convocation annulée avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("PUT /OSEemployeur/candidatures/{id}/convocation/annuler retourne 404 si candidature non trouvée")
    void annulerConvocation_candidatureNonTrouvee_returnsNotFound() throws Exception {
        Long candidatureId = 999L;
        doThrow(new CandidatureNonTrouveeException()).when(employeurService).annulerConvocation(candidatureId);
        mockMvc.perform(put("/OSEemployeur/candidatures/{id}/convocation/annuler", candidatureId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value("CANDIDATURE_NOT_FOUND"));
    }

    @Test
    @DisplayName("GET /OSEemployeur/convocations retourne 200 et liste de convocations")
    void getConvocationsPourEmployeur_success_returnsOkAndList() throws Exception {
        ConvocationEntrevueDTO conv1 = new ConvocationEntrevueDTO();
        ConvocationEntrevueDTO conv2 = new ConvocationEntrevueDTO();
        when(employeurService.getConvocationsPourEmployeur()).thenReturn(java.util.List.of(conv1, conv2));
        mockMvc.perform(get("/OSEemployeur/convocations")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("GET /OSEemployeur/convocations retourne 403 si action non autorisée")
    void getConvocationsPourEmployeur_actionNonAutorisee_returnsForbidden() throws Exception {
        when(employeurService.getConvocationsPourEmployeur()).thenThrow(new ActionNonAutoriseeException());
        mockMvc.perform(get("/OSEemployeur/convocations")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /OSEemployeur/convocations retourne 500 sur erreur interne")
    void getConvocationsPourEmployeur_internalError_returnsInternalServerError() throws Exception {
        when(employeurService.getConvocationsPourEmployeur()).thenThrow(new RuntimeException("Erreur interne"));
        mockMvc.perform(get("/OSEemployeur/convocations")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("POST /OSEemployeur/candidatures/{id}/approuver retourne 200 sur succès")
    void approuverCandidature_success_returnsOk() throws Exception {
        Long candidatureId = 20L;

        mockMvc.perform(post("/OSEemployeur/candidatures/{id}/approuver", candidatureId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Candidature approuvée avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("POST /OSEemployeur/candidatures/{id}/approuver retourne 403 si non autorisé")
    void approuverCandidature_nonAutorise_returnsForbidden() throws Exception {
        Long candidatureId = 21L;
        doThrow(new ActionNonAutoriseeException()).when(employeurService).approuverCandidature(candidatureId);

        mockMvc.perform(post("/OSEemployeur/candidatures/{id}/approuver", candidatureId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.UNAUTHORIZED_ACTION.getCode()));
    }

    @Test
    @DisplayName("POST /OSEemployeur/candidatures/{id}/approuver retourne 404 si candidature non trouvée")
    void approuverCandidature_notFound_returnsNotFound() throws Exception {
        Long candidatureId = 22L;
        doThrow(new CandidatureNonTrouveeException()).when(employeurService).approuverCandidature(candidatureId);

        mockMvc.perform(post("/OSEemployeur/candidatures/{id}/approuver", candidatureId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.CANDIDATURE_NOT_FOUND.getCode()));
    }

    @Test
    @DisplayName("POST /OSEemployeur/candidatures/{id}/approuver retourne 409 si déjà vérifiée")
    void approuverCandidature_conflict_returnsConflict() throws Exception {
        Long candidatureId = 23L;
        doThrow(new CandidatureDejaVerifieException()).when(employeurService).approuverCandidature(candidatureId);

        mockMvc.perform(post("/OSEemployeur/candidatures/{id}/approuver", candidatureId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.CANDIDATURE_ALREADY_VERIFIED.getCode()));
    }

    @Test
    @DisplayName("POST /OSEemployeur/candidatures/{id}/refuser retourne 200 sur succès")
    void refuserCandidature_success_returnsOk() throws Exception {
        Long candidatureId = 30L;
        String json = "{ \"raison\": \"Pas bon profil\" }";

        mockMvc.perform(post("/OSEemployeur/candidatures/{id}/refuser", candidatureId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Candidature refusée avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("POST /OSEemployeur/candidatures/{id}/refuser retourne 403 si non autorisé")
    void refuserCandidature_nonAutorise_returnsForbidden() throws Exception {
        Long candidatureId = 31L;
        String json = "{ \"raison\": \"Motif\" }";
        doThrow(new ActionNonAutoriseeException()).when(employeurService).refuserCandidature(eq(candidatureId), anyString());

        mockMvc.perform(post("/OSEemployeur/candidatures/{id}/refuser", candidatureId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.UNAUTHORIZED_ACTION.getCode()));
    }

    @Test
    @DisplayName("POST /OSEemployeur/candidatures/{id}/refuser retourne 404 si candidature non trouvée")
    void refuserCandidature_notFound_returnsNotFound() throws Exception {
        Long candidatureId = 32L;
        String json = "{ \"raison\": \"Motif\" }";
        doThrow(new CandidatureNonTrouveeException()).when(employeurService).refuserCandidature(eq(candidatureId), anyString());

        mockMvc.perform(post("/OSEemployeur/candidatures/{id}/refuser", candidatureId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.CANDIDATURE_NOT_FOUND.getCode()));
    }

    @Test
    @DisplayName("POST /OSEemployeur/candidatures/{id}/refuser retourne 409 si déjà vérifiée")
    void refuserCandidature_conflict_returnsConflict() throws Exception {
        Long candidatureId = 33L;
        String json = "{ \"raison\": \"Motif\" }";
        doThrow(new CandidatureDejaVerifieException()).when(employeurService).refuserCandidature(eq(candidatureId), anyString());

        mockMvc.perform(post("/OSEemployeur/candidatures/{id}/refuser", candidatureId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.CANDIDATURE_ALREADY_VERIFIED.getCode()));
    }

    @Test
    @DisplayName("GET /OSEemployeur/notifications retourne 200 et liste de notifications")
    void getNotifications_success_returnsOkAndList() throws Exception {
        NotificationDTO notif1 = new NotificationDTO(1L, "messageKey1", "param1", false, LocalDateTime.now());
        NotificationDTO notif2 = new NotificationDTO(2L, "messageKey2", "param2", false, LocalDateTime.now());

        when(employeurService.getNotificationsPourEmployeurConnecte())
                .thenReturn(java.util.List.of(notif1, notif2));

        mockMvc.perform(get("/OSEemployeur/notifications")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    @DisplayName("GET /OSEemployeur/notifications retourne 403 si action non autorisée")
    void getNotifications_actionNonAutorisee_returnsForbidden() throws Exception {
        when(employeurService.getNotificationsPourEmployeurConnecte())
                .thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEemployeur/notifications")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /OSEemployeur/notifications retourne 403 si utilisateur pas trouvé")
    void getNotifications_utilisateurPasTrouve_returnsForbidden() throws Exception {
        when(employeurService.getNotificationsPourEmployeurConnecte())
                .thenThrow(new UtilisateurPasTrouveException());

        mockMvc.perform(get("/OSEemployeur/notifications")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /OSEemployeur/notifications retourne 500 sur erreur interne")
    void getNotifications_internalError_returnsInternalServerError() throws Exception {
        when(employeurService.getNotificationsPourEmployeurConnecte())
                .thenThrow(new RuntimeException("Erreur interne"));

        mockMvc.perform(get("/OSEemployeur/notifications")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("PUT /OSEemployeur/notifications/{id}/lu retourne 200 sur succès")
    void marquerNotificationLu_success_returnsOk() throws Exception {
        Long notificationId = 1L;

        mockMvc.perform(put("/OSEemployeur/notifications/{id}/lu", notificationId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Notification marquée comme lue"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("PUT /OSEemployeur/notifications/{id}/lu retourne 403 si action non autorisée")
    void marquerNotificationLu_actionNonAutorisee_returnsForbidden() throws Exception {
        Long notificationId = 1L;
        doThrow(new ActionNonAutoriseeException())
                .when(employeurService).marquerNotificationLu(eq(notificationId), anyBoolean());

        mockMvc.perform(put("/OSEemployeur/notifications/{id}/lu", notificationId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("true"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.UNAUTHORIZED_ACTION.getCode()));
    }

    @Test
    @DisplayName("PUT /OSEemployeur/notifications/{id}/lu retourne 403 si utilisateur pas trouvé")
    void marquerNotificationLu_utilisateurPasTrouve_returnsForbidden() throws Exception {
        Long notificationId = 1L;
        doThrow(new UtilisateurPasTrouveException())
                .when(employeurService).marquerNotificationLu(eq(notificationId), anyBoolean());

        mockMvc.perform(put("/OSEemployeur/notifications/{id}/lu", notificationId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("true"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.USER_NOT_FOUND.getCode()));
    }

    @Test
    @DisplayName("PUT /OSEemployeur/notifications/{id}/lu retourne 500 sur erreur interne")
    void marquerNotificationLu_internalError_returnsInternalServerError() throws Exception {
        Long notificationId = 1L;
        doThrow(new RuntimeException("Erreur interne"))
                .when(employeurService).marquerNotificationLu(eq(notificationId), anyBoolean());

        mockMvc.perform(put("/OSEemployeur/notifications/{id}/lu", notificationId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("true"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.UNKNOWN_ERROR.getCode()));
    }

    @Test
    @DisplayName("GET /OSEemployeur/offres-approuvees retourne 200 et liste d'offres")
    void getOffresApprouvees_success_returnsOkAndList() throws Exception {
        OffreDTO offre1 = new OffreDTO();
        offre1.setId(1L);
        offre1.setTitre("Offre 1");

        OffreDTO offre2 = new OffreDTO();
        offre2.setId(2L);
        offre2.setTitre("Offre 2");

        when(employeurService.getOffresApprouvees())
                .thenReturn(java.util.List.of(offre1, offre2));

        mockMvc.perform(get("/OSEemployeur/offres-approuvees")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    @DisplayName("GET /OSEemployeur/offres-approuvees retourne 403 si action non autorisée")
    void getOffresApprouvees_actionNonAutorisee_returnsForbidden() throws Exception {
        when(employeurService.getOffresApprouvees())
                .thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEemployeur/offres-approuvees")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /OSEemployeur/offres-approuvees retourne 403 si utilisateur pas trouvé")
    void getOffresApprouvees_utilisateurPasTrouve_returnsForbidden() throws Exception {
        when(employeurService.getOffresApprouvees())
                .thenThrow(new UtilisateurPasTrouveException());

        mockMvc.perform(get("/OSEemployeur/offres-approuvees")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /OSEemployeur/offres-approuvees retourne 500 sur erreur interne")
    void getOffresApprouvees_internalError_returnsInternalServerError() throws Exception {
        when(employeurService.getOffresApprouvees())
                .thenThrow(new RuntimeException("Erreur interne"));

        mockMvc.perform(get("/OSEemployeur/offres-approuvees")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("GET /OSEemployeur/ententes retourne 200 et liste d'ententes")
    void getEntentes_success_returnsOkAndList() throws Exception {
        EntenteStageDTO entente1 = new EntenteStageDTO();
        entente1.setId(1L);

        EntenteStageDTO entente2 = new EntenteStageDTO();
        entente2.setId(2L);

        when(employeurService.getEntentesPourEmployeur())
                .thenReturn(java.util.List.of(entente1, entente2));

        mockMvc.perform(get("/OSEemployeur/ententes")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    @DisplayName("GET /OSEemployeur/ententes retourne 403 si action non autorisée")
    void getEntentes_actionNonAutorisee_returnsForbidden() throws Exception {
        when(employeurService.getEntentesPourEmployeur())
                .thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEemployeur/ententes")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /OSEemployeur/ententes retourne 403 si utilisateur pas trouvé")
    void getEntentes_utilisateurPasTrouve_returnsForbidden() throws Exception {
        when(employeurService.getEntentesPourEmployeur())
                .thenThrow(new UtilisateurPasTrouveException());

        mockMvc.perform(get("/OSEemployeur/ententes")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /OSEemployeur/ententes retourne 500 sur erreur interne")
    void getEntentes_internalError_returnsInternalServerError() throws Exception {
        when(employeurService.getEntentesPourEmployeur())
                .thenThrow(new RuntimeException("Erreur interne"));

        mockMvc.perform(get("/OSEemployeur/ententes")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("GET /OSEemployeur/ententes/en-attente retourne 200 et liste d'ententes en attente")
    void getEntentesEnAttente_success_returnsOkAndList() throws Exception {
        EntenteStageDTO entente1 = new EntenteStageDTO();
        entente1.setId(1L);

        EntenteStageDTO entente2 = new EntenteStageDTO();
        entente2.setId(2L);

        when(employeurService.getEntentesEnAttente())
                .thenReturn(java.util.List.of(entente1, entente2));

        mockMvc.perform(get("/OSEemployeur/ententes/en-attente")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    @DisplayName("GET /OSEemployeur/ententes/en-attente retourne 403 si action non autorisée")
    void getEntentesEnAttente_actionNonAutorisee_returnsForbidden() throws Exception {
        when(employeurService.getEntentesEnAttente())
                .thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEemployeur/ententes/en-attente")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /OSEemployeur/ententes/en-attente retourne 401 si utilisateur pas trouvé")
    void getEntentesEnAttente_utilisateurPasTrouve_returnsUnauthorized() throws Exception {
        when(employeurService.getEntentesEnAttente())
                .thenThrow(new UtilisateurPasTrouveException());

        mockMvc.perform(get("/OSEemployeur/ententes/en-attente")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /OSEemployeur/ententes/en-attente retourne 500 sur erreur interne")
    void getEntentesEnAttente_internalError_returnsInternalServerError() throws Exception {
        when(employeurService.getEntentesEnAttente())
                .thenThrow(new RuntimeException("Erreur interne"));

        mockMvc.perform(get("/OSEemployeur/ententes/en-attente")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("GET /OSEemployeur/ententes/{id} retourne 200 et entente spécifique")
    void getEntenteSpecifique_success_returnsOkAndEntente() throws Exception {
        Long ententeId = 1L;
        EntenteStageDTO entente = new EntenteStageDTO();
        entente.setId(ententeId);

        when(employeurService.getEntenteSpecifique(ententeId))
                .thenReturn(entente);

        mockMvc.perform(get("/OSEemployeur/ententes/{id}", ententeId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(ententeId));
    }

    @Test
    @DisplayName("GET /OSEemployeur/ententes/{id} retourne 403 si action non autorisée")
    void getEntenteSpecifique_actionNonAutorisee_returnsForbidden() throws Exception {
        Long ententeId = 1L;
        when(employeurService.getEntenteSpecifique(ententeId))
                .thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEemployeur/ententes/{id}", ententeId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /OSEemployeur/ententes/{id} retourne 401 si utilisateur pas trouvé")
    void getEntenteSpecifique_utilisateurPasTrouve_returnsUnauthorized() throws Exception {
        Long ententeId = 1L;
        when(employeurService.getEntenteSpecifique(ententeId))
                .thenThrow(new UtilisateurPasTrouveException());

        mockMvc.perform(get("/OSEemployeur/ententes/{id}", ententeId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /OSEemployeur/ententes/{id} retourne 404 sur erreur interne")
    void getEntenteSpecifique_internalError_returnsNotFound() throws Exception {
        Long ententeId = 1L;
        when(employeurService.getEntenteSpecifique(ententeId))
                .thenThrow(new RuntimeException("Erreur interne"));

        mockMvc.perform(get("/OSEemployeur/ententes/{id}", ententeId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /OSEemployeur/ententes/{id}/signer retourne 200 sur succès")
    void signerEntente_success_returnsOk() throws Exception {
        Long ententeId = 1L;

        mockMvc.perform(put("/OSEemployeur/ententes/{id}/signer", ententeId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Entente signée avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("PUT /OSEemployeur/ententes/{id}/signer retourne 403 si action non autorisée")
    void signerEntente_actionNonAutorisee_returnsForbidden() throws Exception {
        Long ententeId = 1L;
        doThrow(new ActionNonAutoriseeException())
                .when(employeurService).signerEntente(ententeId);

        mockMvc.perform(put("/OSEemployeur/ententes/{id}/signer", ententeId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.UNAUTHORIZED_ACTION.getCode()));
    }

    @Test
    @DisplayName("PUT /OSEemployeur/ententes/{id}/signer retourne 401 si utilisateur pas trouvé")
    void signerEntente_utilisateurPasTrouve_returnsUnauthorized() throws Exception {
        Long ententeId = 1L;
        doThrow(new UtilisateurPasTrouveException())
                .when(employeurService).signerEntente(ententeId);

        mockMvc.perform(put("/OSEemployeur/ententes/{id}/signer", ententeId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.USER_NOT_FOUND.getCode()));
    }

    @Test
    @DisplayName("PUT /OSEemployeur/ententes/{id}/signer retourne 500 sur erreur interne")
    void signerEntente_internalError_returnsInternalServerError() throws Exception {
        Long ententeId = 1L;
        doThrow(new RuntimeException("Erreur interne"))
                .when(employeurService).signerEntente(ententeId);

        mockMvc.perform(put("/OSEemployeur/ententes/{id}/signer", ententeId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.UNKNOWN_ERROR.getCode()));
    }

    @Test
    @DisplayName("PUT /OSEemployeur/ententes/{id}/refuser retourne 200 sur succès")
    void refuserEntente_success_returnsOk() throws Exception {
        Long ententeId = 1L;

        mockMvc.perform(put("/OSEemployeur/ententes/{id}/refuser", ententeId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Entente refusée avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("PUT /OSEemployeur/ententes/{id}/refuser retourne 403 si action non autorisée")
    void refuserEntente_actionNonAutorisee_returnsForbidden() throws Exception {
        Long ententeId = 1L;
        doThrow(new ActionNonAutoriseeException())
                .when(employeurService).refuserEntente(ententeId);

        mockMvc.perform(put("/OSEemployeur/ententes/{id}/refuser", ententeId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.UNAUTHORIZED_ACTION.getCode()));
    }

    @Test
    @DisplayName("PUT /OSEemployeur/ententes/{id}/refuser retourne 401 si utilisateur pas trouvé")
    void refuserEntente_utilisateurPasTrouve_returnsUnauthorized() throws Exception {
        Long ententeId = 1L;
        doThrow(new UtilisateurPasTrouveException())
                .when(employeurService).refuserEntente(ententeId);

        mockMvc.perform(put("/OSEemployeur/ententes/{id}/refuser", ententeId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.USER_NOT_FOUND.getCode()));
    }

    @Test
    @DisplayName("PUT /OSEemployeur/ententes/{id}/refuser retourne 500 sur erreur interne")
    void refuserEntente_internalError_returnsInternalServerError() throws Exception {
        Long ententeId = 1L;
        doThrow(new RuntimeException("Erreur interne"))
                .when(employeurService).refuserEntente(ententeId);

        mockMvc.perform(put("/OSEemployeur/ententes/{id}/refuser", ententeId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.UNKNOWN_ERROR.getCode()));
    }
}
