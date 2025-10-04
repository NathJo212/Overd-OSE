package com.backend.controller;

import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.service.DTO.CvDTO;
import com.backend.service.DTO.OffreDTO;
import com.backend.service.DTO.ProgrammeDTO;
import com.backend.service.EtudiantService;
import com.backend.service.UtilisateurService;
import com.backend.service.DTO.EtudiantDTO;
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
        offre1.setDate_debut("2025-05-01");
        offre1.setDate_fin("2025-08-31");
        offre1.setProgEtude(ProgrammeDTO.P420_B0);
        offre1.setLieuStage("Montréal");
        offre1.setRemuneration("20$/h");
        offre1.setDateLimite("2025-04-15");

        OffreDTO offre2 = new OffreDTO();
        offre2.setTitre("Stage en réseaux");
        offre2.setDescription("Administration de réseaux");
        offre2.setDate_debut("2025-06-01");
        offre2.setDate_fin("2025-09-30");
        offre2.setProgEtude(ProgrammeDTO.P420_B0);
        offre2.setLieuStage("Québec");
        offre2.setRemuneration("22$/h");
        offre2.setDateLimite("2025-05-01");

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
}