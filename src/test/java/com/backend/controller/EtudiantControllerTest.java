package com.backend.controller;

import com.backend.Exceptions.*;
import com.backend.service.DTO.*;
import com.backend.service.EtudiantService;
import com.backend.service.UtilisateurService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
                .andExpect(jsonPath("$.erreur.message").value("Le fichier doit être au format PDF."));
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
        MockMultipartFile lettre = new MockMultipartFile(
                "lettreMotivation", "lettre.pdf", "application/pdf", "Contenu lettre".getBytes()
        );

        when(etudiantService.postulerOffre(eq(1L), any())).thenReturn(new CandidatureDTO());

        mockMvc.perform(multipart("/OSEetudiant/candidatures")
                        .file(lettre)
                        .param("offreId", "1"))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("Candidature soumise avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("POST /OSEetudiant/candidatures -> retourne 400 si CV non approuvé")
    void postulerOffre_cvNonApprouve_returnsBadRequest() throws Exception {
        MockMultipartFile lettre = new MockMultipartFile(
                "lettreMotivation", "lettre.pdf", "application/pdf", "Contenu".getBytes()
        );

        doThrow(new CvNonApprouveException())
                .when(etudiantService).postulerOffre(eq(1L), any());

        mockMvc.perform(multipart("/OSEetudiant/candidatures")
                        .file(lettre)
                        .param("offreId", "1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erreur.errorCode").value("CV_003"))
                .andExpect(jsonPath("$.erreur.message").value("Le CV n'a pas été approuvé"));
    }



    @Test
    @DisplayName("POST /OSEetudiant/candidatures -> retourne 500 si erreur interne")
    void postulerOffre_internalError_returnsServerError() throws Exception {
        MockMultipartFile lettre = new MockMultipartFile(
                "lettreMotivation", "lettre.pdf", "application/pdf", "Contenu".getBytes()
        );

        // Simulate an unexpected error
        doThrow(new RuntimeException("Erreur inattendue"))
                .when(etudiantService).postulerOffre(eq(1L), any());

        mockMvc.perform(multipart("/OSEetudiant/candidatures")
                        .file(lettre)
                        .param("offreId", "1"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value("ERROR_000"))
                .andExpect(jsonPath("$.erreur.message").value("Erreur inattendue"));
    }


    @Test
    @DisplayName("GET /OSEetudiant/candidatures -> succès récupération liste candidatures")
    void getMesCandidatures_success_returnsList() throws Exception {
        CandidatureDTO cand1 = new CandidatureDTO();
        cand1.setId(1L);
        cand1.setOffreId(10L);
        cand1.setOffreTitre("Stage développement");
        cand1.setEmployeurNom("TechCorp");
        cand1.setDateCandidature(LocalDateTime.now());
        cand1.setStatut("EN_ATTENTE");
        cand1.setACv(true);
        cand1.setALettreMotivation(true);

        CandidatureDTO cand2 = new CandidatureDTO();
        cand2.setId(2L);
        cand2.setOffreId(11L);
        cand2.setOffreTitre("Stage réseaux");
        cand2.setEmployeurNom("NetCorp");
        cand2.setDateCandidature(LocalDateTime.now());
        cand2.setStatut("EN_ATTENTE");
        cand2.setACv(true);
        cand2.setALettreMotivation(false);

        when(etudiantService.getMesCandidatures()).thenReturn(List.of(cand1, cand2));

        mockMvc.perform(get("/OSEetudiant/candidatures"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].offreTitre").value("Stage développement"))
                .andExpect(jsonPath("$[0].acv").value(true))
                .andExpect(jsonPath("$[0].alettreMotivation").value(true))
                .andExpect(jsonPath("$[1].offreTitre").value("Stage réseaux"))
                .andExpect(jsonPath("$[1].acv").value(true))
                .andExpect(jsonPath("$[1].alettreMotivation").value(false));
    }

    @Test
    @DisplayName("GET /OSEetudiant/candidatures -> erreur interne renvoie 500")
    void getMesCandidatures_internalError_returns500() throws Exception {
        when(etudiantService.getMesCandidatures()).thenThrow(new RuntimeException("Erreur DB"));

        mockMvc.perform(get("/OSEetudiant/candidatures"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("GET /OSEetudiant/candidatures/{id}/cv -> succès récupération CV")
    void getCvCandidature_success() throws Exception {
        byte[] cvBytes = "Contenu CV PDF".getBytes();
        when(etudiantService.getCvPourCandidature(1L)).thenReturn(cvBytes);

        mockMvc.perform(get("/OSEetudiant/candidatures/1/cv"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"cv.pdf\""))
                .andExpect(content().bytes(cvBytes));
    }

    @Test
    @DisplayName("GET /OSEetudiant/candidatures/{id}/cv -> retourne 403 si non autorisé")
    void getCvCandidature_forbidden() throws Exception {
        doThrow(new ActionNonAutoriseeException())
                .when(etudiantService).getCvPourCandidature(1L);

        mockMvc.perform(get("/OSEetudiant/candidatures/1/cv"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /OSEetudiant/candidatures/{id}/cv -> retourne 404 si CV non trouvé")
    void getCvCandidature_notFound() throws Exception {
        // Arrange: etudiantService throws the exception the controller handles
        doThrow(new CandidatureNonDisponibleException())
                .when(etudiantService).getCvPourCandidature(1L);

        // Act & Assert: perform GET request and expect 404
        mockMvc.perform(get("/OSEetudiant/candidatures/1/cv"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /OSEetudiant/candidatures/{id}/lettre-motivation -> succès récupération lettre")
    void getLettreMotivationCandidature_success() throws Exception {
        byte[] lettreBytes = "Contenu lettre PDF".getBytes();
        when(etudiantService.getLettreMotivationPourCandidature(1L)).thenReturn(lettreBytes);

        mockMvc.perform(get("/OSEetudiant/candidatures/1/lettre-motivation"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"lettre-motivation.pdf\""))
                .andExpect(content().bytes(lettreBytes));
    }

    @Test
    @DisplayName("GET /OSEetudiant/candidatures/{id}/lettre-motivation -> 403 si lettre non trouvée")
    void getLettreMotivationCandidature_notFound() throws Exception {
        // Simulate the service throwing LettreDeMotivationNonDisponibleException
        doThrow(new LettreDeMotivationNonDisponibleException())
                .when(etudiantService).getLettreMotivationPourCandidature(1L);

        mockMvc.perform(get("/OSEetudiant/candidatures/1/lettre-motivation"))
                .andExpect(status().isForbidden()); // matches controller mapping
    }




    @Test
    @DisplayName("PUT /OSEetudiant/candidatures/{id}/retirer -> succès retrait candidature")
    void retirerCandidature_success_returnsOkAndMessage() throws Exception {
        mockMvc.perform(put("/OSEetudiant/candidatures/5/retirer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Candidature retirée avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    @DisplayName("PUT /OSEetudiant/candidatures/{id}/retirer -> erreur état invalide")
    void retirerCandidature_badRequest_returnsError() throws Exception {
        // Arrange
        doThrow(new CandidatureNonDisponibleException())
                .when(etudiantService).retirerCandidature(5L);

        // Act & Assert
        mockMvc.perform(put("/OSEetudiant/candidatures/5/retirer"))
                .andExpect(status().isNotFound()) // 404
                .andExpect(jsonPath("$.erreur.errorCode").value("CAND_001"))
                .andExpect(jsonPath("$.erreur.message").value("Candidature non disponible")); // match actual message
    }



    @Test
    @DisplayName("PUT /OSEetudiant/candidatures/{id}/retirer -> erreur interne renvoie 500")
    void retirerCandidature_internalError_returns500() throws Exception {
        doThrow(new RuntimeException("Erreur inattendue"))
                .when(etudiantService).retirerCandidature(5L);

        mockMvc.perform(put("/OSEetudiant/candidatures/5/retirer"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.erreur.errorCode").value("ERROR_000"))
                .andExpect(jsonPath("$.erreur.message").value("Erreur inattendue"));
    }



    @Test
    @DisplayName("GET /OSEetudiant/offres/{id}/a-postule -> succès retourne vrai ou faux")
    void aPostuleOffre_success_returnsOkAndBoolean() throws Exception {
        when(etudiantService.aPostuleOffre(10L)).thenReturn(true);

        mockMvc.perform(get("/OSEetudiant/offres/10/a-postule"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aPostule").value(true));
    }

    @Test
    void getConvocationPourCandidature_success() throws Exception {
        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        dto.candidatureId = 1L;
        dto.dateHeure = LocalDateTime.of(2025, 10, 20, 14, 0);
        dto.lieuOuLien = "Zoom";
        dto.message = "Merci de vous connecter à l’heure";
        dto.statut = "CONVOQUEE";

        Mockito.when(etudiantService.getConvocationPourCandidature(1L)).thenReturn(dto);

        mockMvc.perform(get("/OSEetudiant/candidatures/1/convocation"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidatureId").value(1L))
                .andExpect(jsonPath("$.lieuOuLien").value("Zoom"))
                .andExpect(jsonPath("$.statut").value("CONVOQUEE"));
    }

    @Test
    void getConvocationPourCandidature_actionNonAutorisee() throws Exception {
        Mockito.when(etudiantService.getConvocationPourCandidature(anyLong()))
                .thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEetudiant/candidatures/2/convocation"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getConvocationPourCandidature_utilisateurPasTrouve() throws Exception {
        Mockito.when(etudiantService.getConvocationPourCandidature(anyLong()))
                .thenThrow(new UtilisateurPasTrouveException());

        mockMvc.perform(get("/OSEetudiant/candidatures/3/convocation"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getConvocationPourCandidature_nonTrouvee() throws Exception {
        Mockito.when(etudiantService.getConvocationPourCandidature(anyLong()))
                .thenThrow(new ConvocationNonTrouveeException());

        mockMvc.perform(get("/OSEetudiant/candidatures/4/convocation"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /OSEetudiant/notifications -> retourne liste de notifications")
    void getNotifications_success_returnsList() throws Exception {
        NotificationDTO dto = new NotificationDTO(1L, "key", "param", false, LocalDateTime.now());
        when(etudiantService.getNotificationsPourEtudiantConnecte()).thenReturn(List.of(dto));

        mockMvc.perform(get("/OSEetudiant/notifications").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    @DisplayName("GET /OSEetudiant/notifications -> retourne 403 si action non autorisée")
    void getNotifications_actionNonAutorisee_returnsForbidden() throws Exception {
        when(etudiantService.getNotificationsPourEtudiantConnecte()).thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(get("/OSEetudiant/notifications").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /OSEetudiant/notifications -> retourne 403 si utilisateur non trouvé")
    void getNotifications_utilisateurPasTrouve_returnsForbidden() throws Exception {
        when(etudiantService.getNotificationsPourEtudiantConnecte()).thenThrow(new UtilisateurPasTrouveException());

        mockMvc.perform(get("/OSEetudiant/notifications").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /OSEetudiant/notifications -> retourne 500 sur erreur interne")
    void getNotifications_internalError_returnsInternalServerError() throws Exception {
        when(etudiantService.getNotificationsPourEtudiantConnecte()).thenThrow(new RuntimeException("Erreur interne"));

        mockMvc.perform(get("/OSEetudiant/notifications").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("PUT /OSEetudiant/notifications/{id}/lu -> marque notification lue et retourne 200")
    void marquerNotificationLu_success_returnsOk() throws Exception {
        when(etudiantService.marquerNotificationLu(eq(2L), eq(true))).thenReturn(new NotificationDTO(2L, "k", "p", true, LocalDateTime.now()));

        mockMvc.perform(put("/OSEetudiant/notifications/2/lu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Notification marquée comme lue"));
    }

    @Test
    @DisplayName("PUT /OSEetudiant/notifications/{id}/lu -> retourne 403 si action non autorisée")
    void marquerNotificationLu_actionNonAutorisee_returnsForbidden() throws Exception {
        when(etudiantService.marquerNotificationLu(eq(2L), eq(true))).thenThrow(new ActionNonAutoriseeException());

        mockMvc.perform(put("/OSEetudiant/notifications/2/lu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("true"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.erreur").exists());
    }

    @Test
    @DisplayName("PUT /OSEetudiant/notifications/{id}/lu -> retourne 500 sur erreur interne")
    void marquerNotificationLu_internalError_returnsInternalServerError() throws Exception {
        when(etudiantService.marquerNotificationLu(eq(2L), eq(true))).thenThrow(new RuntimeException("Erreur interne"));

        mockMvc.perform(put("/OSEetudiant/notifications/2/lu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("true"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.erreur").exists());
    }


    @Test
    @DisplayName("PUT /candidatures/{id}/accepter -> succès et 200 OK")
    void accepterOffreApprouvee_success_returnsOkAndMessage() throws Exception {
        // Arrange

        // Act & Assert
        mockMvc.perform(put("/OSEetudiant/candidatures/{id}/accepter", 5L))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("Offre acceptée avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());

        Mockito.verify(etudiantService).accepterOffreApprouvee(5L);
    }

    @Test
    @DisplayName("PUT /candidatures/{id}/accepter -> 403 Forbidden si ActionNonAutoriseeException")
    void accepterOffreApprouvee_unauthorized_returnsForbidden() throws Exception {
        // Arrange
        ActionNonAutoriseeException expectedException = new ActionNonAutoriseeException();
        doThrow(expectedException)
                .when(etudiantService).accepterOffreApprouvee(anyLong());

        // Act & Assert
        mockMvc.perform(put("/OSEetudiant/candidatures/{id}/accepter", 5L))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.UNAUTHORIZED_ACTION.getCode()))
                .andExpect(jsonPath("$.erreur.message").value("Unauthorized action"));
    }

    @Test
    @DisplayName("PUT /candidatures/{id}/accepter -> 404 Not Found si CandidatureNonDisponibleException")
    void accepterOffreApprouvee_candidatureNotFound_returnsNotFound() throws Exception {
        // Arrange
        CandidatureNonDisponibleException expectedException = new CandidatureNonDisponibleException();
        doThrow(expectedException)
                .when(etudiantService).accepterOffreApprouvee(anyLong());

        // Act & Assert
        mockMvc.perform(put("/OSEetudiant/candidatures/{id}/accepter", 5L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.CANDIDATURE_NON_DISPONIBLE.getCode()));
    }

    @Test
    @DisplayName("PUT /candidatures/{id}/accepter -> 400 Bad Request si StatutCandidatureInvalideException")
    void accepterOffreApprouvee_invalidStatus_returnsBadRequest() throws Exception {
        // Arrange
        StatutCandidatureInvalideException expectedException = new StatutCandidatureInvalideException();
        doThrow(expectedException)
                .when(etudiantService).accepterOffreApprouvee(anyLong());

        // Act & Assert
        mockMvc.perform(put("/OSEetudiant/candidatures/{id}/accepter", 5L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.STATUT_CANDIDATURE_INVALID.getCode()));
    }

    @Test
    @DisplayName("PUT /candidatures/{id}/refuser -> succès et 200 OK")
    void refuserOffreApprouvee_success_returnsOkAndMessage() throws Exception {
        // Arrange

        // Act & Assert
        mockMvc.perform(put("/OSEetudiant/candidatures/{id}/refuser", 6L))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("Offre refusée avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());

        // Verify service method was called
        Mockito.verify(etudiantService).refuserOffreApprouvee(6L);
    }

    @Test
    @DisplayName("PUT /candidatures/{id}/refuser -> 403 Forbidden si ActionNonAutoriseeException")
    void refuserOffreApprouvee_unauthorized_returnsForbidden() throws Exception {
        // Arrange
        ActionNonAutoriseeException expectedException = new ActionNonAutoriseeException();
        doThrow(expectedException)
                .when(etudiantService).refuserOffreApprouvee(anyLong());

        // Act & Assert
        mockMvc.perform(put("/OSEetudiant/candidatures/{id}/refuser", 6L))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.UNAUTHORIZED_ACTION.getCode()));
    }

    @Test
    @DisplayName("PUT /candidatures/{id}/refuser -> 404 Not Found si CandidatureNonDisponibleException")
    void refuserOffreApprouvee_candidatureNotFound_returnsNotFound() throws Exception {
        // Arrange
        CandidatureNonDisponibleException expectedException = new CandidatureNonDisponibleException();
        doThrow(expectedException)
                .when(etudiantService).refuserOffreApprouvee(anyLong());

        // Act & Assert
        mockMvc.perform(put("/OSEetudiant/candidatures/{id}/refuser", 6L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.CANDIDATURE_NON_DISPONIBLE.getCode()));
    }

    @Test
    @DisplayName("PUT /candidatures/{id}/refuser -> 400 Bad Request si StatutCandidatureInvalideException")
    void refuserOffreApprouvee_invalidStatus_returnsBadRequest() throws Exception {
        // Arrange
        StatutCandidatureInvalideException expectedException = new StatutCandidatureInvalideException();
        doThrow(expectedException)
                .when(etudiantService).refuserOffreApprouvee(anyLong());

        // Act & Assert
        mockMvc.perform(put("/OSEetudiant/candidatures/{id}/refuser", 6L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erreur.errorCode").value(ErrorCode.STATUT_CANDIDATURE_INVALID.getCode()));
    }


}