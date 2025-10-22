package com.backend.controller;

import com.backend.Exceptions.*;
import com.backend.service.DTO.EtudiantDTO;
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

import java.util.Arrays;
import java.util.Collections;

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

}
