package com.backend.controller;

import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.service.DTO.*;
import com.backend.service.EtudiantService;
import com.backend.service.UtilisateurService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@WebMvcTest(controllers = EtudiantController.class)
@AutoConfigureMockMvc(addFilters = false)
class EtudiantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EtudiantService etudiantService;

    @MockitoBean
    private UtilisateurService utilisateurService;


    @Test
    @DisplayName("POST /OSEetudiant/creerCompte retourne 201 et message sur succès")
    void creerCompte_success_returnsCreatedAndMessage() throws Exception {
        // Arrange
        EtudiantDTO etudiant = new EtudiantDTO();
        etudiant.setEmail("etudiant@exemple.com");
        etudiant.setPassword("Etudiant12?");
        etudiant.setTelephone("(514) 582-9898");
        etudiant.setPrenom("Jean");
        etudiant.setNom("Dupont");
        etudiant.setProgEtude(ProgrammeDTO.P221_D0);
        etudiant.setSession("Automne");
        etudiant.setAnnee("2025");

        mockMvc.perform(post("/OSEetudiant/creerCompte")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(etudiant)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("Étudiant créé avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("POST /OSEetudiant/creerCompte retourne 409 si email déjà utilisé")
    void creerCompte_emailDejaUtilise_returnsConflict() throws Exception {
        doThrow(new EmailDejaUtiliseException())
                .when(etudiantService).creerEtudiant(anyString(), anyString(), anyString(), anyString(), anyString(), any(ProgrammeDTO.class), anyString(), anyString());

        EtudiantDTO etudiant = new EtudiantDTO();
        etudiant.setEmail("test@etudiant.com");
        etudiant.setPassword("Password1!");
        etudiant.setTelephone("1234567890");
        etudiant.setPrenom("Alice");
        etudiant.setNom("Martin");
        etudiant.setProgEtude(ProgrammeDTO.P388_A1);
        etudiant.setSession("Hiver");
        etudiant.setAnnee("2024");

        mockMvc.perform(post("/OSEetudiant/creerCompte")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(etudiant)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value("VALIDATION_001"))
                .andExpect(jsonPath("$.erreur.message").value("Email already used"));
    }

    @Test
    @DisplayName("POST /OSEetudiant/creerCompte retourne 409 si mot de passe invalide")
    void creerCompte_motDePassePasBon_returnsConflict() throws Exception {
        doThrow(new MotPasseInvalideException())
                .when(etudiantService).creerEtudiant(anyString(), anyString(), anyString(), anyString(), anyString(), any(ProgrammeDTO.class), anyString(), anyString());

        EtudiantDTO etudiant = new EtudiantDTO();
        etudiant.setEmail("test@etudiant.com");
        etudiant.setPassword("abc");
        etudiant.setTelephone("1234567890");
        etudiant.setPrenom("Alice");
        etudiant.setNom("Martin");
        etudiant.setProgEtude(ProgrammeDTO.P300_A1_ADMIN);
        etudiant.setSession("Hiver");
        etudiant.setAnnee("2024");

        mockMvc.perform(post("/OSEetudiant/creerCompte")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(etudiant)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value("VALIDATION_002"))
                .andExpect(jsonPath("$.erreur.message").value("Invalid password"));
    }

    @Test
    @DisplayName("GET /OSEetudiant/voirOffres retourne 200 et liste des offres approuvées")
    void voirOffres_success_returnsOkAndOffresList() throws Exception {
        // Arrange
        OffreDTO offre1 = new OffreDTO();
        offre1.setTitre("Stage en développement web");
        offre1.setDescription("Développement d'applications web");
        offre1.setDate_debut(LocalDate.of(2025, 5, 1));
        offre1.setDate_fin(LocalDate.of(2025, 8, 31));
        offre1.setProgEtude(ProgrammeDTO.P420_B0);
        offre1.setLieuStage("Montréal");
        offre1.setRemuneration("20$/h");
        offre1.setDateLimite(LocalDate.of(2025, 4, 15));

        OffreDTO offre2 = new OffreDTO();
        offre2.setTitre("Stage en réseaux");
        offre2.setDescription("Administration de réseaux");
        offre2.setDate_debut(LocalDate.of(2025, 6, 1));
        offre2.setDate_fin(LocalDate.of(2025, 9, 30));
        offre2.setProgEtude(ProgrammeDTO.P420_B0);
        offre2.setLieuStage("Québec");
        offre2.setRemuneration("22$/h");
        offre2.setDateLimite(LocalDate.of(2025, 5, 1));

        List<OffreDTO> offresApprouvees = List.of(offre1, offre2);

        when(etudiantService.getOffresApprouves()).thenReturn(offresApprouvees);

        // Act
        mockMvc.perform(get("/OSEetudiant/voirOffres")
                        .contentType(MediaType.APPLICATION_JSON))
                // Assert
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].titre").value("Stage en développement web"))
                .andExpect(jsonPath("$[0].description").value("Développement d'applications web"))
                .andExpect(jsonPath("$[0].lieuStage").value("Montréal"))
                .andExpect(jsonPath("$[0].remuneration").value("20$/h"))
                .andExpect(jsonPath("$[1].titre").value("Stage en réseaux"))
                .andExpect(jsonPath("$[1].description").value("Administration de réseaux"))
                .andExpect(jsonPath("$[1].lieuStage").value("Québec"))
                .andExpect(jsonPath("$[1].remuneration").value("22$/h"));
    }

    @Test
    @DisplayName("GET /OSEetudiant/voirOffres retourne 200 et liste vide si aucune offre approuvée")
    void voirOffres_aucuneOffre_returnsOkAndEmptyList() throws Exception {
        // Arrange
        when(etudiantService.getOffresApprouves()).thenReturn(List.of());

        // Act
        mockMvc.perform(get("/OSEetudiant/voirOffres")
                        .contentType(MediaType.APPLICATION_JSON))
                // Assert
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("GET /OSEetudiant/voirOffres retourne 500 si erreur interne")
    void voirOffres_erreurInterne_returnsInternalServerError() throws Exception {
        // Arrange
        when(etudiantService.getOffresApprouves()).thenThrow(new RuntimeException("Erreur de base de données"));

        // Act
        mockMvc.perform(get("/OSEetudiant/voirOffres")
                        .contentType(MediaType.APPLICATION_JSON))
                // Assert
                .andExpect(status().isInternalServerError());
    }




    @Test
    @DisplayName("POST /OSEetudiant/cv -> succès upload CV")
    void uploadCv_success() throws Exception {
        MockMultipartFile fichier = new MockMultipartFile(
                "cv", "cv.pdf", "application/pdf", "Contenu".getBytes()
        );

        mockMvc.perform(multipart("/OSEetudiant/cv").file(fichier))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("CV sauvegardé avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("POST /OSEetudiant/cv -> erreur upload CV")
    void uploadCv_failure() throws Exception {
        MockMultipartFile fichier = new MockMultipartFile(
                "cv", "cv.txt", "text/plain", "Mauvais format".getBytes()
        );

        doThrow(new IllegalArgumentException("Le fichier doit être au format PDF."))
                .when(etudiantService).sauvegarderCvEtudiantConnecte(fichier);

        mockMvc.perform(multipart("/OSEetudiant/cv").file(fichier))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value("CV_001"))
                .andExpect(jsonPath("$.erreur.message").value("Erreur lors de l'upload du CV : Le fichier doit être au format PDF."));
    }

    @Test
    @DisplayName("GET /OSEetudiant/cv -> succès récupération CV")
    void getCv_success() throws Exception {
        byte[] contenu = "ContenuCV".getBytes();
        when(etudiantService.getCvEtudiantConnecte()).thenReturn(new CvDTO(contenu));

        mockMvc.perform(get("/OSEetudiant/cv"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"cv.pdf\""))
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(content().bytes(contenu));
    }

    @Test
    @DisplayName("GET /OSEetudiant/cv -> CV introuvable")
    void getCv_failure() throws Exception {
        doThrow(new RuntimeException("CV non trouvé"))
                .when(etudiantService).getCvEtudiantConnecte();

        mockMvc.perform(get("/OSEetudiant/cv"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /OSEetudiant/candidatures -> succès de la candidature")
    void postulerOffre_success_returnsCreatedAndMessage() throws Exception {
        // Arrange
        when(etudiantService.postulerOffre(1L, "Motivation")).thenReturn(new CandidatureDTO());

        // Act & Assert
        mockMvc.perform(post("/OSEetudiant/candidatures")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"offreId\":1, \"lettreMotivation\":\"Motivation\"}"))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("Candidature soumise avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("POST /OSEetudiant/candidatures -> retourne 400 si état invalide ou offre inexistante")
    void postulerOffre_badRequest_returnsError() throws Exception {
        // Arrange
        doThrow(new IllegalStateException("Votre CV doit être approuvé avant de postuler"))
                .when(etudiantService).postulerOffre(1L, "Motivation");

        // Act & Assert
        mockMvc.perform(post("/OSEetudiant/candidatures")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"offreId\":1, \"lettreMotivation\":\"Motivation\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value("CAND_002"))
                .andExpect(jsonPath("$.erreur.message").value("Votre CV doit être approuvé avant de postuler"));
    }

    @Test
    @DisplayName("POST /OSEetudiant/candidatures -> retourne 500 si erreur interne")
    void postulerOffre_internalError_returnsServerError() throws Exception {
        // Arrange
        doThrow(new RuntimeException("Erreur inattendue"))
                .when(etudiantService).postulerOffre(1L, "Motivation");

        // Act & Assert
        mockMvc.perform(post("/OSEetudiant/candidatures")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"offreId\":1, \"lettreMotivation\":\"Motivation\"}"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value("CAND_003"))
                .andExpect(jsonPath("$.erreur.message").value("Erreur lors de la candidature"));
    }

    @Test
    @DisplayName("GET /OSEetudiant/candidatures -> succès récupération liste candidatures")
    void getMesCandidatures_success_returnsList() throws Exception {
        // Arrange
        CandidatureDTO cand1 = new CandidatureDTO();
        cand1.setLettreMotivation("Motivation 1");
        CandidatureDTO cand2 = new CandidatureDTO();
        cand2.setLettreMotivation("Motivation 2");

        when(etudiantService.getMesCandidatures()).thenReturn(List.of(cand1, cand2));

        // Act & Assert
        mockMvc.perform(get("/OSEetudiant/candidatures"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].lettreMotivation").value("Motivation 1"))
                .andExpect(jsonPath("$[1].lettreMotivation").value("Motivation 2"));
    }

    @Test
    @DisplayName("GET /OSEetudiant/candidatures -> erreur interne renvoie 500")
    void getMesCandidatures_internalError_returns500() throws Exception {
        // Arrange
        when(etudiantService.getMesCandidatures()).thenThrow(new RuntimeException("Erreur DB"));

        // Act & Assert
        mockMvc.perform(get("/OSEetudiant/candidatures"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("PUT /OSEetudiant/candidatures/{id}/retirer -> succès retrait candidature")
    void retirerCandidature_success_returnsOkAndMessage() throws Exception {
        // Act & Assert
        mockMvc.perform(put("/OSEetudiant/candidatures/5/retirer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Candidature retirée avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("PUT /OSEetudiant/candidatures/{id}/retirer -> erreur état invalide")
    void retirerCandidature_badRequest_returnsError() throws Exception {
        // Arrange
        doThrow(new IllegalStateException("Candidature déjà traitée"))
                .when(etudiantService).retirerCandidature(5L);

        // Act & Assert
        mockMvc.perform(put("/OSEetudiant/candidatures/5/retirer"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erreur.errorCode").value("CAND_005"))
                .andExpect(jsonPath("$.erreur.message").value("Candidature déjà traitée"));
    }

    @Test
    @DisplayName("PUT /OSEetudiant/candidatures/{id}/retirer -> erreur interne renvoie 500")
    void retirerCandidature_internalError_returns500() throws Exception {
        // Arrange
        doThrow(new RuntimeException("Erreur inattendue"))
                .when(etudiantService).retirerCandidature(5L);

        // Act & Assert
        mockMvc.perform(put("/OSEetudiant/candidatures/5/retirer"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.erreur.errorCode").value("CAND_006"))
                .andExpect(jsonPath("$.erreur.message").value("Erreur lors du retrait de la candidature"));
    }

    @Test
    @DisplayName("GET /OSEetudiant/offres/{id}/a-postule -> succès retourne vrai ou faux")
    void aPostuleOffre_success_returnsOkAndBoolean() throws Exception {
        // Arrange
        when(etudiantService.aPostuleOffre(10L)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(get("/OSEetudiant/offres/10/a-postule"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aPostule").value(true));
    }

    @Test
    @DisplayName("GET /OSEetudiant/offres/{id}/a-postule -> erreur interne retourne 500")
    void aPostuleOffre_internalError_returns500() throws Exception {
        // Arrange
        when(etudiantService.aPostuleOffre(10L)).thenThrow(new RuntimeException("Erreur"));

        // Act & Assert
        mockMvc.perform(get("/OSEetudiant/offres/10/a-postule"))
                .andExpect(status().isInternalServerError());
    }


}