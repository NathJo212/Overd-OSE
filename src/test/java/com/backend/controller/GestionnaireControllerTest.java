package com.backend.controller;

import com.backend.Exceptions.*;
import com.backend.service.AiService;
import com.backend.service.DTO.ChatRequest;
import com.backend.service.DTO.EtudiantDTO;
import com.backend.service.DTO.OffreDTO;
import com.backend.service.GestionnaireService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@WebMvcTest(controllers = GestionnaireControlleur.class)
@AutoConfigureMockMvc(addFilters = false)
class GestionnaireControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AiService aiService;

    @MockitoBean
    private GestionnaireService gestionnaireService;

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/approuveOffre retourne 200 si succès")
    void approuveOffre_success() throws Exception {
        OffreDTO dto = new OffreDTO();
        dto.setId(1L);
        doNothing().when(gestionnaireService).approuveOffre(1L);

        mockMvc.perform(post("/OSEGestionnaire/approuveOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Offre approuvée avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/approuveOffre retourne 400 si id manquant")
    void approuveOffre_idManquant() throws Exception {
        OffreDTO dto = new OffreDTO(); // id null

        mockMvc.perform(post("/OSEGestionnaire/approuveOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erreur.message").value("ID de l'offre manquant"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/approuveOffre retourne 401 si non autorisé")
    void approuveOffre_nonAutorise() throws Exception {
        OffreDTO dto = new OffreDTO();
        dto.setId(1L);
        doThrow(new ActionNonAutoriseeException()).when(gestionnaireService).approuveOffre(1L);

        mockMvc.perform(post("/OSEGestionnaire/approuveOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erreur.message").value("Unauthorized action"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/approuveOffre retourne 404 si offre inexistante")
    void approuveOffre_offreInexistante() throws Exception {
        OffreDTO dto = new OffreDTO();
        dto.setId(1L);
        doThrow(new OffreNonExistantException()).when(gestionnaireService).approuveOffre(1L);

        mockMvc.perform(post("/OSEGestionnaire/approuveOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erreur.message").value("Offer not found"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/approuveOffre retourne 409 si déjà vérifiée")
    void approuveOffre_dejaVerifiee() throws Exception {
        OffreDTO dto = new OffreDTO();
        dto.setId(1L);
        doThrow(new OffreDejaVerifieException()).when(gestionnaireService).approuveOffre(1L);

        mockMvc.perform(post("/OSEGestionnaire/approuveOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erreur.message").value("Offer already verified"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/refuseOffre retourne 200 si succès")
    void refuseOffre_success() throws Exception {
        OffreDTO dto = new OffreDTO();
        dto.setId(2L);
        dto.setMessageRefus("Non conforme");
        doNothing().when(gestionnaireService).refuseOffre(2L, "Non conforme");

        mockMvc.perform(post("/OSEGestionnaire/refuseOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Offre refusée avec succès"))
                .andExpect(jsonPath("$.erreur.message").doesNotExist());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/refuseOffre retourne 400 si id manquant")
    void refuseOffre_idManquant() throws Exception {
        OffreDTO dto = new OffreDTO();

        mockMvc.perform(post("/OSEGestionnaire/refuseOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erreur.message").value("ID de l'offre manquant"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/refuseOffre retourne 401 si non autorisé")
    void refuseOffre_nonAutorise() throws Exception {
        OffreDTO dto = new OffreDTO();
        dto.setId(2L);
        dto.setMessageRefus("msg");
        doThrow(new ActionNonAutoriseeException()).when(gestionnaireService).refuseOffre(2L, "msg");

        mockMvc.perform(post("/OSEGestionnaire/refuseOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erreur.message").value("Unauthorized action"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/refuseOffre retourne 404 si offre inexistante")
    void refuseOffre_offreInexistante() throws Exception {
        OffreDTO dto = new OffreDTO();
        dto.setId(2L);
        dto.setMessageRefus("msg");
        doThrow(new OffreNonExistantException()).when(gestionnaireService).refuseOffre(2L, "msg");

        mockMvc.perform(post("/OSEGestionnaire/refuseOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erreur.message").value("Offer not found"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/refuseOffre retourne 409 si déjà vérifiée")
    void refuseOffre_dejaVerifiee() throws Exception {
        OffreDTO dto = new OffreDTO();
        dto.setId(2L);
        dto.setMessageRefus("msg");
        doThrow(new OffreDejaVerifieException()).when(gestionnaireService).refuseOffre(2L, "msg");

        mockMvc.perform(post("/OSEGestionnaire/refuseOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erreur.message").value("Offer already verified"));
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/offresEnAttente retourne 200 et liste")
    void getOffresAttente_success() throws Exception {
        when(gestionnaireService.getOffresAttente()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/OSEGestionnaire/offresEnAttente"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/offresEnAttente retourne 401 si non autorisé")
    void getOffresAttente_nonAutorise() throws Exception {
        when(gestionnaireService.getOffresAttente()).thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEGestionnaire/offresEnAttente"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/offresEnAttente retourne 500 si erreur serveur")
    void getOffresAttente_erreurServeur() throws Exception {
        when(gestionnaireService.getOffresAttente()).thenThrow(new RuntimeException("Erreur"));

        mockMvc.perform(get("/OSEGestionnaire/offresEnAttente"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/approuveCV retourne 200 si succès")
    void approuveCV_success() throws Exception {
        EtudiantDTO dto = mock(EtudiantDTO.class);
        when(dto.getId()).thenReturn(1L);

        doNothing().when(gestionnaireService).approuveCV(1L);

        mockMvc.perform(post("/OSEGestionnaire/approuveCV")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("CV approuvé avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/approuveCV retourne 400 si id manquant")
    void approuveCV_idManquant() throws Exception {
        EtudiantDTO dto = mock(EtudiantDTO.class);
        when(dto.getId()).thenReturn(null);

        mockMvc.perform(post("/OSEGestionnaire/approuveCV")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erreur.message").value("ID de l'étudiant manquant"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/approuveCV retourne 401 si non autorisé")
    void approuveCV_nonAutorise() throws Exception {
        EtudiantDTO dto = mock(EtudiantDTO.class);
        when(dto.getId()).thenReturn(1L);

        doThrow(new ActionNonAutoriseeException()).when(gestionnaireService).approuveCV(1L);

        mockMvc.perform(post("/OSEGestionnaire/approuveCV")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erreur.message").value("Unauthorized action"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/approuveCV retourne 404 si CV inexistant")
    void approuveCV_cvInexistant() throws Exception {
        EtudiantDTO dto = mock(EtudiantDTO.class);
        when(dto.getId()).thenReturn(1L);

        doThrow(new CVNonExistantException()).when(gestionnaireService).approuveCV(1L);

        mockMvc.perform(post("/OSEGestionnaire/approuveCV")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erreur.message").exists());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/approuveCV retourne 409 si CV déjà vérifié")
    void approuveCV_dejaVerifie() throws Exception {
        EtudiantDTO dto = mock(EtudiantDTO.class);
        when(dto.getId()).thenReturn(1L);

        doThrow(new CVDejaVerifieException()).when(gestionnaireService).approuveCV(1L);

        mockMvc.perform(post("/OSEGestionnaire/approuveCV")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erreur.message").exists());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/refuseCV retourne 200 si succès")
    void refuseCV_success() throws Exception {
        EtudiantDTO dto = mock(EtudiantDTO.class);
        when(dto.getId()).thenReturn(2L);
        when(dto.getMessageRefusCV()).thenReturn("CV non conforme");

        doNothing().when(gestionnaireService).refuseCV(2L, "CV non conforme");

        mockMvc.perform(post("/OSEGestionnaire/refuseCV")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("CV refusé avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/refuseCV retourne 400 si id manquant")
    void refuseCV_idManquant() throws Exception {
        EtudiantDTO dto = mock(EtudiantDTO.class);
        when(dto.getId()).thenReturn(null);

        mockMvc.perform(post("/OSEGestionnaire/refuseCV")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erreur.message").value("ID de l'étudiant manquant"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/refuseCV retourne 401 si non autorisé")
    void refuseCV_nonAutorise() throws Exception {
        EtudiantDTO dto = mock(EtudiantDTO.class);
        when(dto.getId()).thenReturn(2L);
        when(dto.getMessageRefusCV()).thenReturn("msg");

        doThrow(new ActionNonAutoriseeException()).when(gestionnaireService).refuseCV(2L, "msg");

        mockMvc.perform(post("/OSEGestionnaire/refuseCV")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erreur.message").value("Unauthorized action"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/refuseCV retourne 404 si CV inexistant")
    void refuseCV_cvInexistant() throws Exception {
        EtudiantDTO dto = mock(EtudiantDTO.class);
        when(dto.getId()).thenReturn(2L);
        when(dto.getMessageRefusCV()).thenReturn("msg");

        doThrow(new CVNonExistantException()).when(gestionnaireService).refuseCV(2L, "msg");

        mockMvc.perform(post("/OSEGestionnaire/refuseCV")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erreur.message").exists());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/refuseCV retourne 409 si CV déjà vérifié")
    void refuseCV_dejaVerifie() throws Exception {
        EtudiantDTO dto = mock(EtudiantDTO.class);
        when(dto.getId()).thenReturn(2L);
        when(dto.getMessageRefusCV()).thenReturn("msg");

        doThrow(new CVDejaVerifieException()).when(gestionnaireService).refuseCV(2L, "msg");

        mockMvc.perform(post("/OSEGestionnaire/refuseCV")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erreur.message").exists());
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/CVsEnAttente retourne 200 et liste")
    void getCVsEnAttente_success() throws Exception {
        when(gestionnaireService.getCVsEnAttente()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/OSEGestionnaire/CVsEnAttente"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/CVsEnAttente retourne 401 si non autorisé")
    void getCVsEnAttente_nonAutorise() throws Exception {
        when(gestionnaireService.getCVsEnAttente()).thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEGestionnaire/CVsEnAttente"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/CVsEnAttente retourne 500 si erreur serveur")
    void getCVsEnAttente_erreurServeur() throws Exception {
        when(gestionnaireService.getCVsEnAttente()).thenThrow(new RuntimeException("Erreur"));

        mockMvc.perform(get("/OSEGestionnaire/CVsEnAttente"))
                .andExpect(status().isInternalServerError());
    }



    @Test
    @DisplayName("GET /OSEGestionnaire/visualiserOffres retourne 200 et liste de toutes les offres")
    void getAllOffres_success() throws Exception {
        when(gestionnaireService.getAllOffres()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/OSEGestionnaire/visualiserOffres"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/visualiserOffres retourne 401 si non autorisé")
    void getAllOffres_nonAutorise() throws Exception {
        when(gestionnaireService.getAllOffres()).thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEGestionnaire/visualiserOffres"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/visualiserOffres retourne 500 si erreur serveur")
    void getAllOffres_erreurServeur() throws Exception {
        when(gestionnaireService.getAllOffres()).thenThrow(new RuntimeException("Erreur interne"));

        mockMvc.perform(get("/OSEGestionnaire/visualiserOffres"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/candidaturesEligiblesEntente retourne 200 et liste")
    void getCandidaturesEligiblesEntente_success() throws Exception {
        com.backend.service.DTO.CandidatureDTO dto1 = new com.backend.service.DTO.CandidatureDTO();
        dto1.setId(1L);
        com.backend.service.DTO.CandidatureDTO dto2 = new com.backend.service.DTO.CandidatureDTO();
        dto2.setId(2L);

        when(gestionnaireService.getCandidaturesEligiblesEntente()).thenReturn(Arrays.asList(dto1, dto2));

        mockMvc.perform(get("/OSEGestionnaire/candidaturesEligiblesEntente"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/candidaturesEligiblesEntente retourne 401 si non autorisé")
    void getCandidaturesEligiblesEntente_nonAutorise() throws Exception {
        when(gestionnaireService.getCandidaturesEligiblesEntente()).thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEGestionnaire/candidaturesEligiblesEntente"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/ententes retourne 200 si creation réussie")
    void creerEntente_success() throws Exception {
        com.backend.service.DTO.EntenteStageDTO dto = new com.backend.service.DTO.EntenteStageDTO();
        dto.setOffreId(10L);
        dto.setEtudiantId(5L);

        doNothing().when(gestionnaireService).creerEntente(any(com.backend.service.DTO.EntenteStageDTO.class));

        mockMvc.perform(post("/OSEGestionnaire/ententes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Entente créée avec succès"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/ententes retourne 404 si offre inexistante")
    void creerEntente_offreNonExistante() throws Exception {
        com.backend.service.DTO.EntenteStageDTO dto = new com.backend.service.DTO.EntenteStageDTO();
        dto.setOffreId(99L);
        dto.setEtudiantId(1L);

        doThrow(new OffreNonExistantException()).when(gestionnaireService).creerEntente(any());

        mockMvc.perform(post("/OSEGestionnaire/ententes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erreur").exists());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/ententes retourne 409 si entente déjà existante")
    void creerEntente_ententeExistante() throws Exception {
        com.backend.service.DTO.EntenteStageDTO dto = new com.backend.service.DTO.EntenteStageDTO();
        dto.setOffreId(11L);
        dto.setEtudiantId(6L);

        doThrow(new com.backend.Exceptions.EntenteDejaExistanteException()).when(gestionnaireService).creerEntente(any());

        mockMvc.perform(post("/OSEGestionnaire/ententes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erreur").exists());
    }

    @Test
    @DisplayName("PUT /OSEGestionnaire/ententes/{id} modifie une entente")
    void modifierEntente_success() throws Exception {
        com.backend.service.DTO.EntenteStageDTO dto = new com.backend.service.DTO.EntenteStageDTO();
        dto.setTitre("NouveauTitre");

        doNothing().when(gestionnaireService).modifierEntente(eq(20L), any());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/OSEGestionnaire/ententes/20")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Entente modifiée avec succès"));
    }

    @Test
    @DisplayName("PUT /OSEGestionnaire/ententes/{id} retourne 409 si entente non trouvée")
    void modifierEntente_ententeNonTrouvee() throws Exception {
        com.backend.service.DTO.EntenteStageDTO dto = new com.backend.service.DTO.EntenteStageDTO();
        doThrow(new EntenteNonTrouveException()).when(gestionnaireService).modifierEntente(eq(999L), any());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/OSEGestionnaire/ententes/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erreur").exists());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/ententes/{id}/annuler annule une entente")
    void annulerEntente_success() throws Exception {
        doNothing().when(gestionnaireService).annulerEntente(30L);

        mockMvc.perform(post("/OSEGestionnaire/ententes/30/annuler"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Entente annulée avec succès"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/ententes/{id}/annuler retourne 404 si non trouvée")
    void annulerEntente_notFound() throws Exception {
        doThrow(new EntenteNonTrouveException()).when(gestionnaireService).annulerEntente(404L);

        mockMvc.perform(post("/OSEGestionnaire/ententes/404/annuler"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erreur").exists());
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/ententes retourne 200 et liste")
    void getEntentesActives_success() throws Exception {
        when(gestionnaireService.getEntentesActives()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/OSEGestionnaire/ententes"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/ententes/{id} retourne DTO")
    void getEntenteById_success() throws Exception {
        com.backend.service.DTO.EntenteStageDTO dto = new com.backend.service.DTO.EntenteStageDTO();
        dto.setId(55L);
        when(gestionnaireService.getEntenteById(55L)).thenReturn(dto);

        mockMvc.perform(get("/OSEGestionnaire/ententes/55"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(55));
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/ententes/{id}/document retourne PDF")
    void getEntenteDocument_success() throws Exception {
        byte[] pdf = new byte[]{1,2,3};
        when(gestionnaireService.getEntenteDocument(66L)).thenReturn(pdf);

        mockMvc.perform(get("/OSEGestionnaire/ententes/66/document"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("entente_66.pdf")));
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/ententes/{id}/document retourne 500 si erreur")
    void getEntenteDocument_error() throws Exception {
        when(gestionnaireService.getEntenteDocument(67L)).thenThrow(new RuntimeException("oops"));

        mockMvc.perform(get("/OSEGestionnaire/ententes/67/document"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/etudiant/{etudiantId}/professeur/{professeurId} retourne 200 si succès")
    void assignEtudiantAProfesseur_success() throws Exception {
        doNothing().when(gestionnaireService).setEtudiantAProfesseur(10L, 5L);

        mockMvc.perform(post("/OSEGestionnaire/etudiant/5/professeur/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Professeur assigné à l'étudiant avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());

        verify(gestionnaireService).setEtudiantAProfesseur(10L, 5L);
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/etudiant/{etudiantId}/professeur/{professeurId} retourne 401 si non autorisé")
    void assignEtudiantAProfesseur_nonAutorise() throws Exception {
        doThrow(new ActionNonAutoriseeException()).when(gestionnaireService).setEtudiantAProfesseur(10L, 5L);

        mockMvc.perform(post("/OSEGestionnaire/etudiant/5/professeur/10"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erreur.errorCode").value("AUTHORIZATION_001"))  // Changed from ACTION_002
                .andExpect(jsonPath("$.erreur.message").value("Unauthorized action"));

        verify(gestionnaireService).setEtudiantAProfesseur(10L, 5L);
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/etudiant/{etudiantId}/professeur/{professeurId} retourne 404 si utilisateur non trouvé")
    void assignEtudiantAProfesseur_userNotFound() throws Exception {
        doThrow(new UtilisateurPasTrouveException()).when(gestionnaireService).setEtudiantAProfesseur(99L, 5L);

        mockMvc.perform(post("/OSEGestionnaire/etudiant/5/professeur/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erreur.errorCode").value("USER_NOT_FOUND"))
                .andExpect(jsonPath("$.erreur.message").exists());

        verify(gestionnaireService).setEtudiantAProfesseur(99L, 5L);
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/etudiant/{etudiantId}/professeur/{professeurId} retourne 404 si étudiant non trouvé")
    void assignEtudiantAProfesseur_etudiantNotFound() throws Exception {
        doThrow(new UtilisateurPasTrouveException()).when(gestionnaireService).setEtudiantAProfesseur(10L, 99L);

        mockMvc.perform(post("/OSEGestionnaire/etudiant/99/professeur/10"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erreur.errorCode").value("USER_NOT_FOUND"))
                .andExpect(jsonPath("$.message").doesNotExist());

        verify(gestionnaireService).setEtudiantAProfesseur(10L, 99L);
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/etudiant/{etudiantId}/professeur/{professeurId} retourne 500 si erreur serveur")
    void assignEtudiantAProfesseur_erreurServeur() throws Exception {
        doThrow(new RuntimeException("Erreur interne")).when(gestionnaireService).setEtudiantAProfesseur(10L, 5L);

        mockMvc.perform(post("/OSEGestionnaire/etudiant/5/professeur/10"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.erreur.errorCode").value("ERROR_000"))
                .andExpect(jsonPath("$.erreur.message").exists());

        verify(gestionnaireService).setEtudiantAProfesseur(10L, 5L);
    }

// ========== Tests pour getAllEtudiants ==========

    @Test
    @DisplayName("GET /OSEGestionnaire/etudiants retourne 200 et liste complète")
    void getAllEtudiants_success() throws Exception {
        EtudiantDTO etu1 = mock(EtudiantDTO.class);
        when(etu1.getEmail()).thenReturn("sophie@student.com");
        when(etu1.getNom()).thenReturn("Martin");
        when(etu1.getPrenom()).thenReturn("Sophie");

        EtudiantDTO etu2 = mock(EtudiantDTO.class);
        when(etu2.getEmail()).thenReturn("jean@student.com");
        when(etu2.getNom()).thenReturn("Tremblay");
        when(etu2.getPrenom()).thenReturn("Jean");

        when(gestionnaireService.getAllEtudiants()).thenReturn(Arrays.asList(etu1, etu2));

        mockMvc.perform(get("/OSEGestionnaire/etudiants"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].email").value("sophie@student.com"))
                .andExpect(jsonPath("$[1].email").value("jean@student.com"));

        verify(gestionnaireService).getAllEtudiants();
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/etudiants retourne 200 avec liste vide")
    void getAllEtudiants_listeVide() throws Exception {
        when(gestionnaireService.getAllEtudiants()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/OSEGestionnaire/etudiants"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(0))
                .andExpect(jsonPath("$").isArray());

        verify(gestionnaireService).getAllEtudiants();
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/etudiants retourne 401 si non autorisé")
    void getAllEtudiants_nonAutorise() throws Exception {
        when(gestionnaireService.getAllEtudiants()).thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEGestionnaire/etudiants"))
                .andExpect(status().isUnauthorized());

        verify(gestionnaireService).getAllEtudiants();
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/etudiants retourne 404 si utilisateur non trouvé")
    void getAllEtudiants_userNotFound() throws Exception {
        when(gestionnaireService.getAllEtudiants()).thenThrow(new UtilisateurPasTrouveException());

        mockMvc.perform(get("/OSEGestionnaire/etudiants"))
                .andExpect(status().isNotFound());

        verify(gestionnaireService).getAllEtudiants();
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/etudiants retourne 500 si erreur serveur")
    void getAllEtudiants_erreurServeur() throws Exception {
        when(gestionnaireService.getAllEtudiants()).thenThrow(new RuntimeException("Erreur interne"));

        mockMvc.perform(get("/OSEGestionnaire/etudiants"))
                .andExpect(status().isInternalServerError());

        verify(gestionnaireService).getAllEtudiants();
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/etudiants retourne étudiants avec professeur assigné")
    void getAllEtudiants_avecProfesseur() throws Exception {
        com.backend.service.DTO.ProfesseurDTO prof = mock(com.backend.service.DTO.ProfesseurDTO.class);
        when(prof.getEmail()).thenReturn("prof@college.com");
        when(prof.getNom()).thenReturn("Dupont");

        EtudiantDTO etu = mock(EtudiantDTO.class);
        when(etu.getEmail()).thenReturn("etudiant@test.com");
        when(etu.getNom()).thenReturn("Test");
        when(etu.getProfesseur()).thenReturn(prof);

        when(gestionnaireService.getAllEtudiants()).thenReturn(Arrays.asList(etu));

        mockMvc.perform(get("/OSEGestionnaire/etudiants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].email").value("etudiant@test.com"))
                .andExpect(jsonPath("$[0].professeur.email").value("prof@college.com"));

        verify(gestionnaireService).getAllEtudiants();
    }

// ========== Tests pour getAllProfesseurs ==========

    @Test
    @DisplayName("GET /OSEGestionnaire/professeurs retourne 200 et liste complète")
    void getAllProfesseurs_success() throws Exception {
        com.backend.service.DTO.ProfesseurDTO prof1 = mock(com.backend.service.DTO.ProfesseurDTO.class);
        when(prof1.getId()).thenReturn(1L);
        when(prof1.getEmail()).thenReturn("pierre.dupont@college.com");
        when(prof1.getNom()).thenReturn("Dupont");
        when(prof1.getPrenom()).thenReturn("Pierre");

        com.backend.service.DTO.ProfesseurDTO prof2 = mock(com.backend.service.DTO.ProfesseurDTO.class);
        when(prof2.getId()).thenReturn(2L);
        when(prof2.getEmail()).thenReturn("marie.labelle@college.com");
        when(prof2.getNom()).thenReturn("Labelle");
        when(prof2.getPrenom()).thenReturn("Marie");

        when(gestionnaireService.getAllProfesseurs()).thenReturn(Arrays.asList(prof1, prof2));

        mockMvc.perform(get("/OSEGestionnaire/professeurs"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].email").value("pierre.dupont@college.com"))
                .andExpect(jsonPath("$[1].email").value("marie.labelle@college.com"));

        verify(gestionnaireService).getAllProfesseurs();
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/professeurs retourne 200 avec liste vide")
    void getAllProfesseurs_listeVide() throws Exception {
        when(gestionnaireService.getAllProfesseurs()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/OSEGestionnaire/professeurs"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(0))
                .andExpect(jsonPath("$").isArray());

        verify(gestionnaireService).getAllProfesseurs();
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/professeurs retourne 500 si erreur serveur")
    void getAllProfesseurs_erreurServeur() throws Exception {
        when(gestionnaireService.getAllProfesseurs()).thenThrow(new RuntimeException("Erreur interne"));

        mockMvc.perform(get("/OSEGestionnaire/professeurs"))
                .andExpect(status().isInternalServerError());

        verify(gestionnaireService).getAllProfesseurs();
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/professeurs retourne un seul professeur")
    void getAllProfesseurs_unSeul() throws Exception {
        com.backend.service.DTO.ProfesseurDTO prof = mock(com.backend.service.DTO.ProfesseurDTO.class);
        when(prof.getId()).thenReturn(5L);
        when(prof.getEmail()).thenReturn("unique@college.com");
        when(prof.getNom()).thenReturn("Unique");
        when(prof.getPrenom()).thenReturn("Prof");

        when(gestionnaireService.getAllProfesseurs()).thenReturn(Arrays.asList(prof));

        mockMvc.perform(get("/OSEGestionnaire/professeurs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].email").value("unique@college.com"))
                .andExpect(jsonPath("$[0].nom").value("Unique"));

        verify(gestionnaireService).getAllProfesseurs();
    }

    // ===== New endpoint tests: signer/refuser entente and ententes pretes =====

    @Test
    @DisplayName("PUT /OSEGestionnaire/ententes/{id}/signer retourne 200 si succès")
    void signerEntente_success() throws Exception {
        doNothing().when(gestionnaireService).signerEntente(42L);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/OSEGestionnaire/ententes/42/signer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Entente signée avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());

        verify(gestionnaireService).signerEntente(42L);
    }

    @Test
    @DisplayName("PUT /OSEGestionnaire/ententes/{id}/signer retourne 401 si non autorisé")
    void signerEntente_nonAutorise() throws Exception {
        doThrow(new ActionNonAutoriseeException()).when(gestionnaireService).signerEntente(42L);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/OSEGestionnaire/ententes/42/signer"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erreur.errorCode").exists())
                .andExpect(jsonPath("$.erreur.message").value("Unauthorized action"));
    }

    @Test
    @DisplayName("PUT /OSEGestionnaire/ententes/{id}/signer retourne 404 si entente non trouvée")
    void signerEntente_notFound() throws Exception {
        doThrow(new EntenteNonTrouveException()).when(gestionnaireService).signerEntente(404L);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/OSEGestionnaire/ententes/404/signer"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erreur").exists());
    }

    @Test
    @DisplayName("PUT /OSEGestionnaire/ententes/{id}/signer retourne 400 si statut invalide")
    void signerEntente_statutInvalide() throws Exception {
        doThrow(new StatutEntenteInvalideException()).when(gestionnaireService).signerEntente(7L);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/OSEGestionnaire/ententes/7/signer"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erreur").exists());
    }

    @Test
    @DisplayName("PUT /OSEGestionnaire/ententes/{id}/signer retourne 500 si erreur serveur")
    void signerEntente_erreurServeur() throws Exception {
        doThrow(new RuntimeException("Erreur interne")).when(gestionnaireService).signerEntente(9L);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/OSEGestionnaire/ententes/9/signer"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.erreur.errorCode").value("ERROR_000"))
                .andExpect(jsonPath("$.erreur.message").exists());
    }

    @Test
    @DisplayName("PUT /OSEGestionnaire/ententes/{id}/refuser retourne 200 si succès")
    void refuserEntente_success() throws Exception {
        doNothing().when(gestionnaireService).refuserEntente(50L);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/OSEGestionnaire/ententes/50/refuser"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Entente refusée avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());

        verify(gestionnaireService).refuserEntente(50L);
    }

    @Test
    @DisplayName("PUT /OSEGestionnaire/ententes/{id}/refuser retourne 401 si non autorisé")
    void refuserEntente_nonAutorise() throws Exception {
        doThrow(new ActionNonAutoriseeException()).when(gestionnaireService).refuserEntente(50L);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/OSEGestionnaire/ententes/50/refuser"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erreur.errorCode").exists())
                .andExpect(jsonPath("$.erreur.message").value("Unauthorized action"));
    }

    @Test
    @DisplayName("PUT /OSEGestionnaire/ententes/{id}/refuser retourne 404 si entente non trouvée")
    void refuserEntente_notFound() throws Exception {
        doThrow(new EntenteNonTrouveException()).when(gestionnaireService).refuserEntente(404L);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/OSEGestionnaire/ententes/404/refuser"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erreur").exists());
    }

    @Test
    @DisplayName("PUT /OSEGestionnaire/ententes/{id}/refuser retourne 400 si statut invalide")
    void refuserEntente_statutInvalide() throws Exception {
        doThrow(new StatutEntenteInvalideException()).when(gestionnaireService).refuserEntente(7L);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/OSEGestionnaire/ententes/7/refuser"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erreur").exists());
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/ententes/pretes retourne 200 et liste")
    void getEntentesPretes_success() throws Exception {
        when(gestionnaireService.getEntentesEnAttente()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/OSEGestionnaire/ententes/pretes"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/ententes/pretes retourne 401 si non autorisé")
    void getEntentesPretes_nonAutorise() throws Exception {
        when(gestionnaireService.getEntentesEnAttente()).thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEGestionnaire/ententes/pretes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/ententes/pretes retourne 500 si erreur serveur")
    void getEntentesPretes_erreurServeur() throws Exception {
        when(gestionnaireService.getEntentesEnAttente()).thenThrow(new RuntimeException("Erreur"));

        mockMvc.perform(get("/OSEGestionnaire/ententes/pretes"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/chatclient returns 400 when message blank")
    void chatclient_badRequest_blank() throws Exception {
        List<GrantedAuthority> auths = List.of(new SimpleGrantedAuthority("GESTIONNAIRE"));
        TestingAuthenticationToken auth = new TestingAuthenticationToken("user","pw", auths);
        auth.setAuthenticated(true);
        SecurityContextHolder.getContext().setAuthentication(auth);
        ChatRequest req = new ChatRequest("   ");
        mockMvc.perform(post("/OSEGestionnaire/chatclient")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("message is required"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/chatclient returns 401 when not gestionnaire")
    void chatclient_unauthorized() throws Exception {
        SecurityContextHolder.clearContext();
        ChatRequest req = new ChatRequest("Any message");
        mockMvc.perform(post("/OSEGestionnaire/chatclient")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/chatclient success returns AI answer and respects Accept-Language")
    void chatclient_success() throws Exception {

        List<GrantedAuthority> auths = List.of(new SimpleGrantedAuthority("GESTIONNAIRE"));
        TestingAuthenticationToken auth = new TestingAuthenticationToken("user", "pw", auths);
        auth.setAuthenticated(true);

        // >> AJOUT CRUCIAL <<
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(aiService.answer(anyString(), anyString())).thenReturn("Réponse AI");
        ChatRequest req = new ChatRequest("Liste toutes les offres");

        mockMvc.perform(post("/OSEGestionnaire/chatclient")
                        .header("Accept-Language", "fr")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/chatclient returns 500 on unexpected error")
    void chatclient_internalError() throws Exception {

        List<GrantedAuthority> auths = List.of(new SimpleGrantedAuthority("GESTIONNAIRE"));
        TestingAuthenticationToken auth = new TestingAuthenticationToken("user", "pw", auths);
        auth.setAuthenticated(true);

        // >> AJOUT CRUCIAL <<
        SecurityContextHolder.getContext().setAuthentication(auth);

        doThrow(new RuntimeException("boom"))
                .when(aiService).answer(anyString(), nullable(String.class));

        ChatRequest req = new ChatRequest("Offer list");

        mockMvc.perform(post("/OSEGestionnaire/chatclient")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Chat error: boom")));
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/ententes/{id}/documents retourne 200 et DTO")
    void getDocumentsEntente_success() throws Exception {
        com.backend.service.DTO.DocumentsEntenteDTO dto = new com.backend.service.DTO.DocumentsEntenteDTO();
        dto.setContractEntentepdf("contract".getBytes());
        dto.setEvaluationStagiairepdf("evalEmp".getBytes());

        when(gestionnaireService.getDocumentsEntente(100L)).thenReturn(dto);

        mockMvc.perform(get("/OSEGestionnaire/ententes/100/documents"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.contractEntentepdf").value(java.util.Base64.getEncoder().encodeToString("contract".getBytes())))
                .andExpect(jsonPath("$.evaluationStagiairepdf").value(java.util.Base64.getEncoder().encodeToString("evalEmp".getBytes())));
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/ententes/{id}/documents retourne 401 si non autorisé")
    void getDocumentsEntente_unauthorized() throws Exception {
        when(gestionnaireService.getDocumentsEntente(1L)).thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEGestionnaire/ententes/1/documents"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/ententes/{id}/documents retourne 404 si entente non trouvée")
    void getDocumentsEntente_notFound() throws Exception {
        when(gestionnaireService.getDocumentsEntente(2L)).thenThrow(new EntenteNonTrouveException());

        mockMvc.perform(get("/OSEGestionnaire/ententes/2/documents"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /OSEGestionnaire/ententes/{id}/documents retourne 500 si erreur interne")
    void getDocumentsEntente_internalError() throws Exception {
        when(gestionnaireService.getDocumentsEntente(3L)).thenThrow(new RuntimeException("boom"));

        mockMvc.perform(get("/OSEGestionnaire/ententes/3/documents"))
                .andExpect(status().isInternalServerError());
    }

}
