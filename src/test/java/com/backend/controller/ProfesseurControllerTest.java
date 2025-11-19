package com.backend.controller;

import com.backend.Exceptions.*;
import com.backend.modele.Professeur;
import com.backend.service.DTO.*;
import com.backend.service.ProfesseurService;
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

import java.util.Arrays;
import java.util.Collections;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@WebMvcTest(controllers = ProfesseurController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProfesseurControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ProfesseurService professeurService;

    // ========== Tests pour getMesEtudiants ==========

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants retourne 200 et liste des étudiants")
    void getMesEtudiants_success() throws Exception {
        Professeur professeur = mock(Professeur.class);
        when(professeur.getId()).thenReturn(1L);

        EtudiantDTO etu1 = new EtudiantDTO();
        etu1.setId(10L);
        etu1.setEmail("etu1@test.com");
        etu1.setNom("Martin");
        etu1.setPrenom("Sophie");

        EtudiantDTO etu2 = new EtudiantDTO();
        etu2.setId(20L);
        etu2.setEmail("etu2@test.com");
        etu2.setNom("Tremblay");
        etu2.setPrenom("Jean");

        when(professeurService.getProfesseurConnecte()).thenReturn(professeur);
        when(professeurService.getMesEtudiants(1L)).thenReturn(Arrays.asList(etu1, etu2));

        mockMvc.perform(get("/OSEProfesseur/etudiants"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].email").value("etu1@test.com"))
                .andExpect(jsonPath("$[1].email").value("etu2@test.com"));

        verify(professeurService).getProfesseurConnecte();
        verify(professeurService).getMesEtudiants(1L);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants retourne 200 avec liste vide")
    void getMesEtudiants_listeVide() throws Exception {
        Professeur professeur = mock(Professeur.class);
        when(professeur.getId()).thenReturn(1L);

        when(professeurService.getProfesseurConnecte()).thenReturn(professeur);
        when(professeurService.getMesEtudiants(1L)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/OSEProfesseur/etudiants"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(0))
                .andExpect(jsonPath("$").isArray());

        verify(professeurService).getProfesseurConnecte();
        verify(professeurService).getMesEtudiants(1L);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants retourne 403 si non autorisé")
    void getMesEtudiants_accesNonAutorise() throws Exception {
        when(professeurService.getProfesseurConnecte()).thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEProfesseur/etudiants"))
                .andExpect(status().isForbidden());

        verify(professeurService).getProfesseurConnecte();
        verify(professeurService, never()).getMesEtudiants(anyLong());
    }

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants retourne 404 si professeur non trouvé")
    void getMesEtudiants_professeurNonTrouve() throws Exception {
        when(professeurService.getProfesseurConnecte()).thenThrow(new UtilisateurPasTrouveException());

        mockMvc.perform(get("/OSEProfesseur/etudiants"))
                .andExpect(status().isNotFound());

        verify(professeurService).getProfesseurConnecte();
    }

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants retourne 500 si erreur serveur")
    void getMesEtudiants_erreurInterne() throws Exception {
        when(professeurService.getProfesseurConnecte()).thenThrow(new RuntimeException("Erreur inattendue"));

        mockMvc.perform(get("/OSEProfesseur/etudiants"))
                .andExpect(status().isInternalServerError());

        verify(professeurService).getProfesseurConnecte();
    }

    // ========== Tests pour telechargerCvEtudiant ==========

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants/{etudiantId}/cv retourne 200 et le CV")
    void telechargerCvEtudiant_success() throws Exception {
        Long etudiantId = 10L;
        byte[] cvData = "CV content".getBytes();

        when(professeurService.getCvEtudiantPourProfesseur(etudiantId)).thenReturn(cvData);

        mockMvc.perform(get("/OSEProfesseur/etudiants/{etudiantId}/cv", etudiantId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"cv.pdf\""))
                .andExpect(content().bytes(cvData));

        verify(professeurService).getCvEtudiantPourProfesseur(etudiantId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants/{etudiantId}/cv retourne 404 si CV non existant")
    void telechargerCvEtudiant_cvNonExistant() throws Exception {
        Long etudiantId = 10L;

        when(professeurService.getCvEtudiantPourProfesseur(etudiantId)).thenThrow(new CVNonExistantException());

        mockMvc.perform(get("/OSEProfesseur/etudiants/{etudiantId}/cv", etudiantId))
                .andExpect(status().isNotFound());

        verify(professeurService).getCvEtudiantPourProfesseur(etudiantId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants/{etudiantId}/cv retourne 404 si étudiant non trouvé")
    void telechargerCvEtudiant_etudiantNonTrouve() throws Exception {
        Long etudiantId = 99L;

        when(professeurService.getCvEtudiantPourProfesseur(etudiantId)).thenThrow(new UtilisateurPasTrouveException());

        mockMvc.perform(get("/OSEProfesseur/etudiants/{etudiantId}/cv", etudiantId))
                .andExpect(status().isNotFound());

        verify(professeurService).getCvEtudiantPourProfesseur(etudiantId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants/{etudiantId}/cv retourne 500 si erreur serveur")
    void telechargerCvEtudiant_erreurServeur() throws Exception {
        Long etudiantId = 10L;

        when(professeurService.getCvEtudiantPourProfesseur(etudiantId)).thenThrow(new RuntimeException("Erreur"));

        mockMvc.perform(get("/OSEProfesseur/etudiants/{etudiantId}/cv", etudiantId))
                .andExpect(status().isInternalServerError());

        verify(professeurService).getCvEtudiantPourProfesseur(etudiantId);
    }

    // ========== Tests pour getEntentesPourEtudiant ==========

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants/{etudiantId}/ententes retourne 200 et liste")
    void getEntentesPourEtudiant_success() throws Exception {
        Long etudiantId = 10L;

        EntenteStageDTO entente1 = new EntenteStageDTO();
        entente1.setId(100L);
        entente1.setTitre("Stage 1");

        EntenteStageDTO entente2 = new EntenteStageDTO();
        entente2.setId(200L);
        entente2.setTitre("Stage 2");

        when(professeurService.getEntentesPourEtudiant(etudiantId)).thenReturn(Arrays.asList(entente1, entente2));

        mockMvc.perform(get("/OSEProfesseur/etudiants/{etudiantId}/ententes", etudiantId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(100))
                .andExpect(jsonPath("$[1].id").value(200));

        verify(professeurService).getEntentesPourEtudiant(etudiantId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants/{etudiantId}/ententes retourne 200 avec liste vide")
    void getEntentesPourEtudiant_listeVide() throws Exception {
        Long etudiantId = 10L;

        when(professeurService.getEntentesPourEtudiant(etudiantId)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/OSEProfesseur/etudiants/{etudiantId}/ententes", etudiantId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(0));

        verify(professeurService).getEntentesPourEtudiant(etudiantId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants/{etudiantId}/ententes retourne 404 si étudiant non trouvé")
    void getEntentesPourEtudiant_etudiantNonTrouve() throws Exception {
        Long etudiantId = 99L;

        when(professeurService.getEntentesPourEtudiant(etudiantId)).thenThrow(new UtilisateurPasTrouveException());

        mockMvc.perform(get("/OSEProfesseur/etudiants/{etudiantId}/ententes", etudiantId))
                .andExpect(status().isNotFound());

        verify(professeurService).getEntentesPourEtudiant(etudiantId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants/{etudiantId}/ententes retourne 500 si erreur serveur")
    void getEntentesPourEtudiant_erreurServeur() throws Exception {
        Long etudiantId = 10L;

        when(professeurService.getEntentesPourEtudiant(etudiantId)).thenThrow(new RuntimeException("Erreur"));

        mockMvc.perform(get("/OSEProfesseur/etudiants/{etudiantId}/ententes", etudiantId))
                .andExpect(status().isInternalServerError());

        verify(professeurService).getEntentesPourEtudiant(etudiantId);
    }

    // ========== Tests pour getCandidaturesPourEtudiant ==========

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants/{etudiantId}/candidatures retourne 200 et liste")
    void getCandidaturesPourEtudiant_success() throws Exception {
        Long etudiantId = 10L;

        CandidatureDTO cand1 = new CandidatureDTO();
        cand1.setId(1L);

        CandidatureDTO cand2 = new CandidatureDTO();
        cand2.setId(2L);

        when(professeurService.getCandidaturesPourEtudiant(etudiantId)).thenReturn(Arrays.asList(cand1, cand2));

        mockMvc.perform(get("/OSEProfesseur/etudiants/{etudiantId}/candidatures", etudiantId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));

        verify(professeurService).getCandidaturesPourEtudiant(etudiantId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants/{etudiantId}/candidatures retourne 200 avec liste vide")
    void getCandidaturesPourEtudiant_listeVide() throws Exception {
        Long etudiantId = 10L;

        when(professeurService.getCandidaturesPourEtudiant(etudiantId)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/OSEProfesseur/etudiants/{etudiantId}/candidatures", etudiantId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(0));

        verify(professeurService).getCandidaturesPourEtudiant(etudiantId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants/{etudiantId}/candidatures retourne 404 si étudiant non trouvé")
    void getCandidaturesPourEtudiant_etudiantNonTrouve() throws Exception {
        Long etudiantId = 99L;

        when(professeurService.getCandidaturesPourEtudiant(etudiantId)).thenThrow(new UtilisateurPasTrouveException());

        mockMvc.perform(get("/OSEProfesseur/etudiants/{etudiantId}/candidatures", etudiantId))
                .andExpect(status().isNotFound());

        verify(professeurService).getCandidaturesPourEtudiant(etudiantId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/etudiants/{etudiantId}/candidatures retourne 500 si erreur serveur")
    void getCandidaturesPourEtudiant_erreurServeur() throws Exception {
        Long etudiantId = 10L;

        when(professeurService.getCandidaturesPourEtudiant(etudiantId)).thenThrow(new RuntimeException("Erreur"));

        mockMvc.perform(get("/OSEProfesseur/etudiants/{etudiantId}/candidatures", etudiantId))
                .andExpect(status().isInternalServerError());

        verify(professeurService).getCandidaturesPourEtudiant(etudiantId);
    }

    // ========== Tests pour telechargerLettrePresentation ==========

    @Test
    @DisplayName("GET /OSEProfesseur/candidatures/{candidatureId}/lettre retourne 200 et la lettre")
    void telechargerLettrePresentation_success() throws Exception {
        Long candidatureId = 5L;
        byte[] lettreData = "Lettre de motivation content".getBytes();

        when(professeurService.getLettrePresentationParCandidature(candidatureId)).thenReturn(lettreData);

        mockMvc.perform(get("/OSEProfesseur/candidatures/{candidatureId}/lettre", candidatureId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition", "attachment; filename=LettrePresentation_5.pdf"))
                .andExpect(content().bytes(lettreData));

        verify(professeurService).getLettrePresentationParCandidature(candidatureId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/candidatures/{candidatureId}/lettre retourne 404 si candidature non trouvée")
    void telechargerLettrePresentation_candidatureNonTrouvee() throws Exception {
        Long candidatureId = 99L;

        when(professeurService.getLettrePresentationParCandidature(candidatureId))
                .thenThrow(new UtilisateurPasTrouveException());

        mockMvc.perform(get("/OSEProfesseur/candidatures/{candidatureId}/lettre", candidatureId))
                .andExpect(status().isNotFound());  // Changed from is5xxServerError()

        verify(professeurService).getLettrePresentationParCandidature(candidatureId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/candidatures/{candidatureId}/lettre retourne 404 si lettre non disponible")
    void telechargerLettrePresentation_lettreNonDisponible() throws Exception {
        Long candidatureId = 5L;

        when(professeurService.getLettrePresentationParCandidature(candidatureId))
                .thenThrow(new LettreDeMotivationNonDisponibleException());

        mockMvc.perform(get("/OSEProfesseur/candidatures/{candidatureId}/lettre", candidatureId))
                .andExpect(status().isNotFound());  // Changed from is5xxServerError() to isNotFound()

        verify(professeurService).getLettrePresentationParCandidature(candidatureId);
    }

    // ========== Tests pour getStatutStage ==========

    @Test
    @DisplayName("GET /OSEProfesseur/ententes/{ententeId}/statut retourne 200 avec PAS_COMMENCE")
    void getStatutStage_pasCommence() throws Exception {
        Long ententeId = 1L;

        when(professeurService.getStatutStage(ententeId)).thenReturn(StatutStageDTO.PAS_COMMENCE);

        mockMvc.perform(get("/OSEProfesseur/ententes/{ententeId}/statut", ententeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("PAS_COMMENCE"));

        verify(professeurService).getStatutStage(ententeId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/ententes/{ententeId}/statut retourne 200 avec EN_COURS")
    void getStatutStage_enCours() throws Exception {
        Long ententeId = 2L;

        when(professeurService.getStatutStage(ententeId)).thenReturn(StatutStageDTO.EN_COURS);

        mockMvc.perform(get("/OSEProfesseur/ententes/{ententeId}/statut", ententeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("EN_COURS"));

        verify(professeurService).getStatutStage(ententeId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/ententes/{ententeId}/statut retourne 200 avec TERMINE")
    void getStatutStage_termine() throws Exception {
        Long ententeId = 3L;

        when(professeurService.getStatutStage(ententeId)).thenReturn(StatutStageDTO.TERMINE);

        mockMvc.perform(get("/OSEProfesseur/ententes/{ententeId}/statut", ententeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("TERMINE"));

        verify(professeurService).getStatutStage(ententeId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/ententes/{ententeId}/statut retourne 404 si entente non trouvée")
    void getStatutStage_ententeNonTrouvee() throws Exception {
        Long ententeId = 99L;

        when(professeurService.getStatutStage(ententeId)).thenThrow(new EntenteNonTrouveeException());

        mockMvc.perform(get("/OSEProfesseur/ententes/{ententeId}/statut", ententeId))
                .andExpect(status().isNotFound());

        verify(professeurService).getStatutStage(ententeId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/ententes/{ententeId}/statut retourne 500 si erreur serveur")
    void getStatutStage_erreurServeur() throws Exception {
        Long ententeId = 1L;

        when(professeurService.getStatutStage(ententeId)).thenThrow(new RuntimeException("Erreur"));

        mockMvc.perform(get("/OSEProfesseur/ententes/{ententeId}/statut", ententeId))
                .andExpect(status().isInternalServerError());

        verify(professeurService).getStatutStage(ententeId);
    }

    // ========== Tests pour creerEvaluationMilieuStage ==========

    @Test
    @DisplayName("POST /OSEProfesseur/evaluation-milieu-stage retourne 201 lors de la création")
    void creerEvaluationMilieuStage_success() throws Exception {
        CreerEvaluationMilieuStageDTO dto = new CreerEvaluationMilieuStageDTO();
        dto.setEntenteId(100L);

        doNothing().when(professeurService).creerEvaluationMilieuStage(any(CreerEvaluationMilieuStageDTO.class));

        mockMvc.perform(post("/OSEProfesseur/evaluation-milieu-stage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Évaluation du milieu de stage créée avec succès"));

        verify(professeurService).creerEvaluationMilieuStage(any(CreerEvaluationMilieuStageDTO.class));
    }

    @Test
    @DisplayName("POST /OSEProfesseur/evaluation-milieu-stage retourne 403 si non autorisé")
    void creerEvaluationMilieuStage_nonAutorise() throws Exception {
        CreerEvaluationMilieuStageDTO dto = new CreerEvaluationMilieuStageDTO();
        dto.setEntenteId(100L);

        doThrow(new ActionNonAutoriseeException()).when(professeurService)
                .creerEvaluationMilieuStage(any(CreerEvaluationMilieuStageDTO.class));

        mockMvc.perform(post("/OSEProfesseur/evaluation-milieu-stage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
        verify(professeurService).creerEvaluationMilieuStage(any(CreerEvaluationMilieuStageDTO.class));
    }

    @Test
    @DisplayName("POST /OSEProfesseur/evaluation-milieu-stage retourne 404 si entente non trouvée")
    void creerEvaluationMilieuStage_ententeNonTrouvee() throws Exception {
        CreerEvaluationMilieuStageDTO dto = new CreerEvaluationMilieuStageDTO();
        dto.setEntenteId(999L);

        doThrow(new EntenteNonTrouveException()).when(professeurService)
                .creerEvaluationMilieuStage(any(CreerEvaluationMilieuStageDTO.class));

        mockMvc.perform(post("/OSEProfesseur/evaluation-milieu-stage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
        verify(professeurService).creerEvaluationMilieuStage(any(CreerEvaluationMilieuStageDTO.class));
    }

    @Test
    @DisplayName("POST /OSEProfesseur/evaluation-milieu-stage retourne 409 si évaluation déjà existante")
    void creerEvaluationMilieuStage_evaluationDejaExistante() throws Exception {
        CreerEvaluationMilieuStageDTO dto = new CreerEvaluationMilieuStageDTO();
        dto.setEntenteId(100L);

        doThrow(new EvaluationDejaExistanteException()).when(professeurService)
                .creerEvaluationMilieuStage(any(CreerEvaluationMilieuStageDTO.class));

        mockMvc.perform(post("/OSEProfesseur/evaluation-milieu-stage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());

        verify(professeurService).creerEvaluationMilieuStage(any(CreerEvaluationMilieuStageDTO.class));
    }

    @Test
    @DisplayName("POST /OSEProfesseur/evaluation-milieu-stage retourne 400 si entente non finalisée")
    void creerEvaluationMilieuStage_ententeNonFinalisee() throws Exception {
        CreerEvaluationMilieuStageDTO dto = new CreerEvaluationMilieuStageDTO();
        dto.setEntenteId(100L);

        doThrow(new EntenteNonFinaliseeException()).when(professeurService)
                .creerEvaluationMilieuStage(any(CreerEvaluationMilieuStageDTO.class));

        mockMvc.perform(post("/OSEProfesseur/evaluation-milieu-stage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());

        verify(professeurService).creerEvaluationMilieuStage(any(CreerEvaluationMilieuStageDTO.class));
    }

    @Test
    @DisplayName("POST /OSEProfesseur/evaluation-milieu-stage retourne 401 si utilisateur non trouvé")
    void creerEvaluationMilieuStage_utilisateurNonTrouve() throws Exception {
        CreerEvaluationMilieuStageDTO dto = new CreerEvaluationMilieuStageDTO();
        dto.setEntenteId(100L);

        doThrow(new UtilisateurPasTrouveException()).when(professeurService)
                .creerEvaluationMilieuStage(any(CreerEvaluationMilieuStageDTO.class));

        mockMvc.perform(post("/OSEProfesseur/evaluation-milieu-stage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized());
        verify(professeurService).creerEvaluationMilieuStage(any(CreerEvaluationMilieuStageDTO.class));
    }

    // ========== Tests pour getEvaluationsMilieuStage ==========

    @Test
    @DisplayName("GET /OSEProfesseur/evaluations-milieu-stage retourne 200 et liste des évaluations")
    void getEvaluationsMilieuStage_success() throws Exception {
        EvaluationMilieuStageDTO eval1 = new EvaluationMilieuStageDTO();
        eval1.setId(1L);
        // adaptation: EvaluationMilieuStageDTO n'a plus 'nomEntreprise' -> on met un pdfBase64
        eval1.setPdfBase64(java.util.Base64.getEncoder().encodeToString("PDF1".getBytes()));

        EvaluationMilieuStageDTO eval2 = new EvaluationMilieuStageDTO();
        eval2.setId(2L);
        eval2.setPdfBase64(java.util.Base64.getEncoder().encodeToString("PDF2".getBytes()));

        when(professeurService.getEvaluationsMilieuStagePourProfesseur())
                .thenReturn(Arrays.asList(eval1, eval2));

        mockMvc.perform(get("/OSEProfesseur/evaluations-milieu-stage"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));

        verify(professeurService).getEvaluationsMilieuStagePourProfesseur();
    }

    @Test
    @DisplayName("GET /OSEProfesseur/evaluations-milieu-stage retourne 200 avec liste vide")
    void getEvaluationsMilieuStage_listeVide() throws Exception {
        when(professeurService.getEvaluationsMilieuStagePourProfesseur())
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/OSEProfesseur/evaluations-milieu-stage"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(0));

        verify(professeurService).getEvaluationsMilieuStagePourProfesseur();
    }

    @Test
    @DisplayName("GET /OSEProfesseur/evaluations-milieu-stage retourne 403 si non autorisé")
    void getEvaluationsMilieuStage_nonAutorise() throws Exception {
        when(professeurService.getEvaluationsMilieuStagePourProfesseur())
                .thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEProfesseur/evaluations-milieu-stage"))
                .andExpect(status().isForbidden());

        verify(professeurService).getEvaluationsMilieuStagePourProfesseur();
    }

    // ========== Tests pour getEvaluationMilieuStageSpecifique ==========

    @Test
    @DisplayName("GET /OSEProfesseur/evaluations-milieu-stage/{id} retourne 200 et l'évaluation")
    void getEvaluationMilieuStageSpecifique_success() throws Exception {
        Long evaluationId = 1L;

        EvaluationMilieuStageDTO evaluation = new EvaluationMilieuStageDTO();
        evaluation.setId(evaluationId);
        // adaptation : plus de 'nomEntreprise' ni 'qualiteEncadrement' dans DTO -> utiliser pdfBase64
        evaluation.setPdfBase64(java.util.Base64.getEncoder().encodeToString("PDF content".getBytes()));
        evaluation.setEntenteId(100L);

        when(professeurService.getEvaluationMilieuStageSpecifique(evaluationId))
                .thenReturn(evaluation);

        mockMvc.perform(get("/OSEProfesseur/evaluations-milieu-stage/{id}", evaluationId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.ententeId").value(100))
                .andExpect(jsonPath("$.pdfBase64").value(java.util.Base64.getEncoder().encodeToString("PDF content".getBytes())));

        verify(professeurService).getEvaluationMilieuStageSpecifique(evaluationId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/evaluations-milieu-stage/{id} retourne 403 si non autorisé")
    void getEvaluationMilieuStageSpecifique_nonAutorise() throws Exception {
        Long evaluationId = 1L;

        when(professeurService.getEvaluationMilieuStageSpecifique(evaluationId))
                .thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEProfesseur/evaluations-milieu-stage/{id}", evaluationId))
                .andExpect(status().isForbidden());

        verify(professeurService).getEvaluationMilieuStageSpecifique(evaluationId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/evaluations-milieu-stage/{id} retourne 404 si évaluation non trouvée")
    void getEvaluationMilieuStageSpecifique_nonTrouvee() throws Exception {
        Long evaluationId = 999L;

        when(professeurService.getEvaluationMilieuStageSpecifique(evaluationId))
                .thenThrow(new RuntimeException("Évaluation non trouvée"));

        mockMvc.perform(get("/OSEProfesseur/evaluations-milieu-stage/{id}", evaluationId))
                .andExpect(status().isNotFound());

        verify(professeurService).getEvaluationMilieuStageSpecifique(evaluationId);
    }

    // ========== Tests pour getEvaluationMilieuStagePdf ==========

    @Test
    @DisplayName("GET /OSEProfesseur/evaluations-milieu-stage/{id}/pdf retourne 200 et le PDF")
    void getEvaluationMilieuStagePdf_success() throws Exception {
        Long evaluationId = 1L;
        byte[] pdfData = "PDF content".getBytes();

        when(professeurService.getEvaluationMilieuStagePdf(evaluationId))
                .thenReturn(pdfData);

        mockMvc.perform(get("/OSEProfesseur/evaluations-milieu-stage/{id}/pdf", evaluationId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"evaluation-milieu-stage.pdf\""))
                .andExpect(content().bytes(pdfData));

        verify(professeurService).getEvaluationMilieuStagePdf(evaluationId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/evaluations-milieu-stage/{id}/pdf retourne 403 si non autorisé")
    void getEvaluationMilieuStagePdf_nonAutorise() throws Exception {
        Long evaluationId = 1L;

        when(professeurService.getEvaluationMilieuStagePdf(evaluationId))
                .thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEProfesseur/evaluations-milieu-stage/{id}/pdf", evaluationId))
                .andExpect(status().isForbidden());

        verify(professeurService).getEvaluationMilieuStagePdf(evaluationId);
    }

    @Test
    @DisplayName("GET /OSEProfesseur/evaluations-milieu-stage/{id}/pdf retourne 404 si PDF non disponible")
    void getEvaluationMilieuStagePdf_nonDisponible() throws Exception {
        Long evaluationId = 1L;

        when(professeurService.getEvaluationMilieuStagePdf(evaluationId))
                .thenThrow(new RuntimeException("PDF non disponible"));

        mockMvc.perform(get("/OSEProfesseur/evaluations-milieu-stage/{id}/pdf", evaluationId))
                .andExpect(status().isNotFound());

        verify(professeurService).getEvaluationMilieuStagePdf(evaluationId);
    }
}
