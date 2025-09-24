package com.backend.controller;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.OffreDejaVerifieException;
import com.backend.Exceptions.OffreNonExistantException;
import com.backend.service.DTO.MessageRetourDTO;
import com.backend.service.DTO.OffreDTO;
import com.backend.service.GestionnaireService;
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

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
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
    private GestionnaireService gestionnaireService;

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
                .andExpect(jsonPath("$.message").value("ID de l'offre manquant"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/approuveOffre retourne 401 si non autorisé")
    void approuveOffre_nonAutorise() throws Exception {
        OffreDTO dto = new OffreDTO();
        dto.setId(1L);
        doThrow(new ActionNonAutoriseeException("Accès refusé")).when(gestionnaireService).approuveOffre(1L);

        mockMvc.perform(post("/OSEGestionnaire/approuveOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erreur").value("Accès refusé"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/approuveOffre retourne 404 si offre inexistante")
    void approuveOffre_offreInexistante() throws Exception {
        OffreDTO dto = new OffreDTO();
        dto.setId(1L);
        doThrow(new OffreNonExistantException("Offre introuvable")).when(gestionnaireService).approuveOffre(1L);

        mockMvc.perform(post("/OSEGestionnaire/approuveOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erreur").value("Offre introuvable"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/approuveOffre retourne 409 si déjà vérifiée")
    void approuveOffre_dejaVerifiee() throws Exception {
        OffreDTO dto = new OffreDTO();
        dto.setId(1L);
        doThrow(new OffreDejaVerifieException("Déjà vérifiée")).when(gestionnaireService).approuveOffre(1L);

        mockMvc.perform(post("/OSEGestionnaire/approuveOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erreur").value("Déjà vérifiée"));
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
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/refuseOffre retourne 400 si id manquant")
    void refuseOffre_idManquant() throws Exception {
        OffreDTO dto = new OffreDTO();

        mockMvc.perform(post("/OSEGestionnaire/refuseOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erreur").value("ID de l'offre manquant"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/refuseOffre retourne 401 si non autorisé")
    void refuseOffre_nonAutorise() throws Exception {
        OffreDTO dto = new OffreDTO();
        dto.setId(2L);
        dto.setMessageRefus("msg");
        doThrow(new ActionNonAutoriseeException("Accès refusé")).when(gestionnaireService).refuseOffre(2L, "msg");

        mockMvc.perform(post("/OSEGestionnaire/refuseOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erreur").value("Accès refusé"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/refuseOffre retourne 404 si offre inexistante")
    void refuseOffre_offreInexistante() throws Exception {
        OffreDTO dto = new OffreDTO();
        dto.setId(2L);
        dto.setMessageRefus("msg");
        doThrow(new OffreNonExistantException("Offre introuvable")).when(gestionnaireService).refuseOffre(2L, "msg");

        mockMvc.perform(post("/OSEGestionnaire/refuseOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erreur").value("Offre introuvable"));
    }

    @Test
    @DisplayName("POST /OSEGestionnaire/refuseOffre retourne 409 si déjà vérifiée")
    void refuseOffre_dejaVerifiee() throws Exception {
        OffreDTO dto = new OffreDTO();
        dto.setId(2L);
        dto.setMessageRefus("msg");
        doThrow(new OffreDejaVerifieException("Déjà vérifiée")).when(gestionnaireService).refuseOffre(2L, "msg");

        mockMvc.perform(post("/OSEGestionnaire/refuseOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erreur").value("Déjà vérifiée"));
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
        when(gestionnaireService.getOffresAttente()).thenThrow(new ActionNonAutoriseeException("Accès refusé"));

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
}
