package com.backend.controller;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.modele.Employeur;
import com.backend.service.DTO.AuthResponseDTO;
import com.backend.service.DTO.OffreDTO;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
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
        doThrow(new EmailDejaUtiliseException("Un employeur avec cet email existe déjà"))
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
                .andExpect(jsonPath("$.erreur").value("Un employeur avec cet email existe déjà"));
    }

    @Test
    @DisplayName("POST /OSEemployeur/creerCompte retourne 409 si mot de passe invalide")
    void creerCompte_motDePassePasBon_returnsConflict() throws Exception {
        doThrow(new EmailDejaUtiliseException("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial."))
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
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur").value("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial."));
    }

    @Test
    void creerOffre_success_returnsCreatedAndMessage() throws Exception {
        OffreDTO offreDTO = new OffreDTO();
        offreDTO.setAuthResponseDTO(new AuthResponseDTO("Bearer validToken"));
        offreDTO.setTitre("titre");
        offreDTO.setDescription("desc");
        offreDTO.setDate_debut("2024-01-01");
        offreDTO.setDate_fin("2024-06-01");
        offreDTO.setProgEtude("prog");
        offreDTO.setLieuStage("lieu");
        offreDTO.setRemuneration("rem");
        offreDTO.setDateLimite("2024-05-01");

        mockMvc.perform(post("/OSEemployeur/creerOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(offreDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Offre de stage créée avec succès"))
                .andExpect(jsonPath("$.erreur").doesNotExist());
    }

    @Test
    void creerOffre_actionNonAutorisee_returnsConflict() throws Exception {
        doThrow(new ActionNonAutoriseeException("Seul un employeur peut créer une offre de stage."))
                .when(employeurService).creerOffreDeStage(any(AuthResponseDTO.class), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString());

        OffreDTO offreDTO = new OffreDTO();
        offreDTO.setAuthResponseDTO(new AuthResponseDTO("Bearer fakeToken"));
        offreDTO.setTitre("titre");
        offreDTO.setDescription("desc");
        offreDTO.setDate_debut("2024-01-01");
        offreDTO.setDate_fin("2024-06-01");
        offreDTO.setProgEtude("prog");
        offreDTO.setLieuStage("lieu");
        offreDTO.setRemuneration("rem");
        offreDTO.setDateLimite("2024-05-01");

        mockMvc.perform(post("/OSEemployeur/creerOffre")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(offreDTO)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.erreur").value("Seul un employeur peut créer une offre de stage."));
    }
}
