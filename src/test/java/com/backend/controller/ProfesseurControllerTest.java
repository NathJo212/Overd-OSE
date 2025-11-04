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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
                .andExpect(header().string("Content-Disposition", "attachment; filename=CV_10.pdf"))
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
}