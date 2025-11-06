package com.backend.service;

import com.backend.Exceptions.*;
import com.backend.modele.*;
import com.backend.persistence.*;
import com.backend.service.DTO.*;
import com.backend.util.EncryptageCV;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.*;

import static java.util.Arrays.asList;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProfesseurServiceTest {

    @Mock
    private ProfesseurRepository professeurRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EtudiantRepository etudiantRepository;

    @Mock
    private EncryptageCV encryptageCV;

    @Mock
    private EntenteStageRepository ententeStageRepository;

    @Mock
    private CandidatureRepository candidatureRepository;

    @Mock
    private EvaluationMilieuStageParProfesseurRepository evaluationMilieuStageParProfesseurRepository;

    @Mock
    private EmployeurRepository employeurRepository;

    @InjectMocks
    private ProfesseurService professeurService;

    @BeforeEach
    public void setupSecurityContext() {
        Authentication auth = mock(Authentication.class);
        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("PROFESSEUR")
        );
        lenient().when(auth.getAuthorities()).thenReturn((Collection) authorities);
        lenient().when(auth.getName()).thenReturn("prof@test.com");

        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(auth);

        SecurityContextHolder.setContext(securityContext);
    }

    // ========== Tests pour creerProfesseur ==========

    @Test
    public void creerProfesseur_creeEtSauvegarde() throws Exception {
        when(utilisateurRepository.existsByEmail("nouveau@test.com")).thenReturn(false);
        when(passwordEncoder.encode("ValidPass123!")).thenReturn("hashedPassword");

        professeurService.creerProfesseur("nouveau@test.com", "ValidPass123!", "514-123-4567", "Jean", "Dupont");

        verify(professeurRepository).save(any(Professeur.class));
    }

    @Test
    public void creerProfesseur_emailDejaUtilise_lance() {
        when(utilisateurRepository.existsByEmail("existant@test.com")).thenReturn(true);

        assertThrows(EmailDejaUtiliseException.class, () ->
                professeurService.creerProfesseur("existant@test.com", "ValidPass123!", "514-123-4567", "Jean", "Dupont")
        );

        verify(professeurRepository, never()).save(any());
    }

    @Test
    public void creerProfesseur_motPasseInvalide_pasAssezLong() {
        when(utilisateurRepository.existsByEmail("test@test.com")).thenReturn(false);

        assertThrows(MotPasseInvalideException.class, () ->
                professeurService.creerProfesseur("test@test.com", "Pass1!", "514-123-4567", "Jean", "Dupont")
        );

        verify(professeurRepository, never()).save(any());
    }

    @Test
    public void creerProfesseur_motPasseInvalide_pasMajuscule() {
        when(utilisateurRepository.existsByEmail("test@test.com")).thenReturn(false);

        assertThrows(MotPasseInvalideException.class, () ->
                professeurService.creerProfesseur("test@test.com", "password123!", "514-123-4567", "Jean", "Dupont")
        );

        verify(professeurRepository, never()).save(any());
    }

    @Test
    public void creerProfesseur_motPasseInvalide_pasChiffre() {
        when(utilisateurRepository.existsByEmail("test@test.com")).thenReturn(false);

        assertThrows(MotPasseInvalideException.class, () ->
                professeurService.creerProfesseur("test@test.com", "Password!", "514-123-4567", "Jean", "Dupont")
        );

        verify(professeurRepository, never()).save(any());
    }

    @Test
    public void creerProfesseur_motPasseInvalide_pasCaractereSpecial() {
        when(utilisateurRepository.existsByEmail("test@test.com")).thenReturn(false);

        assertThrows(MotPasseInvalideException.class, () ->
                professeurService.creerProfesseur("test@test.com", "Password123", "514-123-4567", "Jean", "Dupont")
        );

        verify(professeurRepository, never()).save(any());
    }

    // ========== Tests pour getProfesseurConnecte ==========

    @Test
    public void getProfesseurConnecte_retourneProfesseur() throws Exception {
        Professeur professeur = new Professeur("prof@test.com", "hashedPass", "514-123-4567", "Dupont", "Pierre");
        when(professeurRepository.existsByEmail("prof@test.com")).thenReturn(true);
        when(professeurRepository.findByEmail("prof@test.com")).thenReturn(professeur);

        Professeur result = professeurService.getProfesseurConnecte();

        assertNotNull(result);
        assertEquals("prof@test.com", result.getEmail());
        assertEquals("Dupont", result.getNom());
    }

    @Test
    public void getProfesseurConnecte_pasProfesseur_lance() {
        Authentication auth = mock(Authentication.class);
        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ETUDIANT")
        );
        when(auth.getAuthorities()).thenReturn((Collection) authorities);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        assertThrows(ActionNonAutoriseeException.class, () ->
                professeurService.getProfesseurConnecte()
        );
    }

    @Test
    public void getProfesseurConnecte_professeurNonTrouve_lance() {
        when(professeurRepository.existsByEmail("prof@test.com")).thenReturn(false);

        assertThrows(UtilisateurPasTrouveException.class, () ->
                professeurService.getProfesseurConnecte()
        );
    }

    // ========== Tests pour getMesEtudiants ==========

    @Test
    public void getMesEtudiants_retourneListeEtudiants() throws Exception {
        Etudiant etu1 = mock(Etudiant.class);
        when(etu1.getEmail()).thenReturn("etu1@test.com");
        when(etu1.getNom()).thenReturn("Martin");
        when(etu1.getPrenom()).thenReturn("Sophie");

        Etudiant etu2 = mock(Etudiant.class);
        when(etu2.getEmail()).thenReturn("etu2@test.com");
        when(etu2.getNom()).thenReturn("Tremblay");
        when(etu2.getPrenom()).thenReturn("Jean");

        Professeur professeur = mock(Professeur.class);
        when(professeur.getEtudiantList()).thenReturn(asList(etu1, etu2));

        when(professeurRepository.findById(1L)).thenReturn(Optional.of(professeur));

        List<EtudiantDTO> result = professeurService.getMesEtudiants(1L);

        assertEquals(2, result.size());
    }

    @Test
    public void getMesEtudiants_listeVide() throws Exception {
        Professeur professeur = mock(Professeur.class);
        when(professeur.getEtudiantList()).thenReturn(Collections.emptyList());

        when(professeurRepository.findById(1L)).thenReturn(Optional.of(professeur));

        List<EtudiantDTO> result = professeurService.getMesEtudiants(1L);

        assertTrue(result.isEmpty());
    }

    @Test
    public void getMesEtudiants_professeurNonTrouve_lance() {
        when(professeurRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UtilisateurPasTrouveException.class, () ->
                professeurService.getMesEtudiants(99L)
        );
    }

    // ========== Tests pour getCvEtudiantPourProfesseur ==========

    @Test
    public void getCvEtudiantPourProfesseur_retourneCV() throws Exception {
        byte[] cvChiffre = "cvChiffre".getBytes();
        byte[] cvDechiffre = "cvDechiffre".getBytes();

        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getCv()).thenReturn(cvChiffre);

        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));
        when(encryptageCV.dechiffrer("cvChiffre")).thenReturn(cvDechiffre);

        byte[] result = professeurService.getCvEtudiantPourProfesseur(1L);

        assertNotNull(result);
        assertArrayEquals(cvDechiffre, result);
        verify(encryptageCV).dechiffrer("cvChiffre");
    }

    @Test
    public void getCvEtudiantPourProfesseur_etudiantNonTrouve_lance() {
        when(etudiantRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UtilisateurPasTrouveException.class, () ->
                professeurService.getCvEtudiantPourProfesseur(99L)
        );
    }

    @Test
    public void getCvEtudiantPourProfesseur_cvNull_lance() {
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getCv()).thenReturn(null);

        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));

        assertThrows(CVNonExistantException.class, () ->
                professeurService.getCvEtudiantPourProfesseur(1L)
        );
    }

    @Test
    public void getCvEtudiantPourProfesseur_cvVide_lance() {
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getCv()).thenReturn(new byte[0]);

        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));

        assertThrows(CVNonExistantException.class, () ->
                professeurService.getCvEtudiantPourProfesseur(1L)
        );
    }

    @Test
    public void getCvEtudiantPourProfesseur_erreurDechiffrement_lance() throws Exception {
        byte[] cvChiffre = "cvChiffre".getBytes();

        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getCv()).thenReturn(cvChiffre);

        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));
        when(encryptageCV.dechiffrer("cvChiffre")).thenThrow(new RuntimeException("Erreur de déchiffrement"));

        assertThrows(CVNonExistantException.class, () ->
                professeurService.getCvEtudiantPourProfesseur(1L)
        );
    }

    // ========== Tests pour getEntentesPourEtudiant ==========

    @Test
    public void getEntentesPourEtudiant_retourneListe() throws Exception {
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiantRepository.existsById(1L)).thenReturn(true);

        Employeur employeur = mock(Employeur.class);
        EntenteStage entente1 = new EntenteStage();
        entente1.setId(10L);
        entente1.setEmployeur(employeur);
        entente1.setEtudiant(etudiant);
        entente1.setTitre("Stage 1");

        EntenteStage entente2 = new EntenteStage();
        entente2.setId(20L);
        entente2.setEmployeur(employeur);
        entente2.setEtudiant(etudiant);
        entente2.setTitre("Stage 2");

        when(ententeStageRepository.findByEtudiantId(1L)).thenReturn(asList(entente1, entente2));

        List<EntenteStageDTO> result = professeurService.getEntentesPourEtudiant(1L);

        assertEquals(2, result.size());
    }

    @Test
    public void getEntentesPourEtudiant_listeVide() throws Exception {
        when(etudiantRepository.existsById(1L)).thenReturn(true);
        when(ententeStageRepository.findByEtudiantId(1L)).thenReturn(Collections.emptyList());

        List<EntenteStageDTO> result = professeurService.getEntentesPourEtudiant(1L);

        assertTrue(result.isEmpty());
    }

    @Test
    public void getEntentesPourEtudiant_etudiantNonTrouve_lance() {
        when(etudiantRepository.existsById(99L)).thenReturn(false);

        assertThrows(UtilisateurPasTrouveException.class, () ->
                professeurService.getEntentesPourEtudiant(99L)
        );
    }

    // ========== Tests pour getCandidaturesPourEtudiant ==========

    @Test
    public void getCandidaturesPourEtudiant_retourneListe() throws Exception {
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiantRepository.existsById(1L)).thenReturn(true);

        Employeur employeur = mock(Employeur.class);
        Offre offre1 = new Offre();
        offre1.setId(5L);
        offre1.setEmployeur(employeur);

        Offre offre2 = new Offre();
        offre2.setId(6L);
        offre2.setEmployeur(employeur);

        Candidature cand1 = new Candidature();
        cand1.setId(100L);
        cand1.setOffre(offre1);
        cand1.setEtudiant(etudiant);

        Candidature cand2 = new Candidature();
        cand2.setId(200L);
        cand2.setOffre(offre2);
        cand2.setEtudiant(etudiant);

        when(candidatureRepository.findByEtudiantId(1L)).thenReturn(asList(cand1, cand2));

        List<CandidatureDTO> result = professeurService.getCandidaturesPourEtudiant(1L);

        assertEquals(2, result.size());
    }

    @Test
    public void getCandidaturesPourEtudiant_listeVide() throws Exception {
        when(etudiantRepository.existsById(1L)).thenReturn(true);
        when(candidatureRepository.findByEtudiantId(1L)).thenReturn(Collections.emptyList());

        List<CandidatureDTO> result = professeurService.getCandidaturesPourEtudiant(1L);

        assertTrue(result.isEmpty());
    }

    @Test
    public void getCandidaturesPourEtudiant_etudiantNonTrouve_lance() {
        when(etudiantRepository.existsById(99L)).thenReturn(false);

        assertThrows(UtilisateurPasTrouveException.class, () ->
                professeurService.getCandidaturesPourEtudiant(99L)
        );
    }

    // ========== Tests pour getLettrePresentationParCandidature ==========

    @Test
    public void getLettrePresentationParCandidature_retourneLettre() throws Exception {
        byte[] lettreChiffree = "lettreChiffree".getBytes();
        byte[] lettreDechiffree = "lettreDechiffree".getBytes();

        Candidature candidature = mock(Candidature.class);
        when(candidature.getLettreMotivation()).thenReturn(lettreChiffree);

        when(candidatureRepository.findById(1L)).thenReturn(Optional.of(candidature));
        when(encryptageCV.dechiffrer("lettreChiffree")).thenReturn(lettreDechiffree);

        byte[] result = professeurService.getLettrePresentationParCandidature(1L);

        assertNotNull(result);
        assertArrayEquals(lettreDechiffree, result);
        verify(encryptageCV).dechiffrer("lettreChiffree");
    }

    @Test
    public void getLettrePresentationParCandidature_candidatureNonTrouvee_lance() {
        when(candidatureRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UtilisateurPasTrouveException.class, () ->
                professeurService.getLettrePresentationParCandidature(99L)
        );
    }

    @Test
    public void getLettrePresentationParCandidature_lettreNull_lance() {
        Candidature candidature = mock(Candidature.class);
        when(candidature.getLettreMotivation()).thenReturn(null);

        when(candidatureRepository.findById(1L)).thenReturn(Optional.of(candidature));

        assertThrows(LettreDeMotivationNonDisponibleException.class, () ->
                professeurService.getLettrePresentationParCandidature(1L)
        );
    }

    @Test
    public void getLettrePresentationParCandidature_lettreVide_lance() {
        Candidature candidature = mock(Candidature.class);
        when(candidature.getLettreMotivation()).thenReturn(new byte[0]);

        when(candidatureRepository.findById(1L)).thenReturn(Optional.of(candidature));

        assertThrows(LettreDeMotivationNonDisponibleException.class, () ->
                professeurService.getLettrePresentationParCandidature(1L)
        );
    }

    @Test
    public void getLettrePresentationParCandidature_erreurDechiffrement_lance() throws Exception {
        byte[] lettreChiffree = "lettreChiffree".getBytes();

        Candidature candidature = mock(Candidature.class);
        when(candidature.getLettreMotivation()).thenReturn(lettreChiffree);

        when(candidatureRepository.findById(1L)).thenReturn(Optional.of(candidature));
        when(encryptageCV.dechiffrer("lettreChiffree")).thenThrow(new RuntimeException("Erreur"));

        assertThrows(LettreDeMotivationNonDisponibleException.class, () ->
                professeurService.getLettrePresentationParCandidature(1L)
        );
    }

    // ========== Tests pour getStatutStage ==========

    @Test
    public void getStatutStage_pasCommence() throws Exception {
        EntenteStage entente = new EntenteStage();
        entente.setId(1L);
        entente.setDateDebut(LocalDate.now().plusDays(10));
        entente.setDateFin(LocalDate.now().plusDays(100));

        when(ententeStageRepository.findById(1L)).thenReturn(Optional.of(entente));

        StatutStageDTO result = professeurService.getStatutStage(1L);

        assertEquals(StatutStageDTO.PAS_COMMENCE, result);
    }

    @Test
    public void getStatutStage_enCours() throws Exception {
        EntenteStage entente = new EntenteStage();
        entente.setId(1L);
        entente.setDateDebut(LocalDate.now().minusDays(10));
        entente.setDateFin(LocalDate.now().plusDays(10));

        when(ententeStageRepository.findById(1L)).thenReturn(Optional.of(entente));

        StatutStageDTO result = professeurService.getStatutStage(1L);

        assertEquals(StatutStageDTO.EN_COURS, result);
    }

    @Test
    public void getStatutStage_enCoursDateDebutAujourdhui() throws Exception {
        EntenteStage entente = new EntenteStage();
        entente.setId(1L);
        entente.setDateDebut(LocalDate.now());
        entente.setDateFin(LocalDate.now().plusDays(10));

        when(ententeStageRepository.findById(1L)).thenReturn(Optional.of(entente));

        StatutStageDTO result = professeurService.getStatutStage(1L);

        assertEquals(StatutStageDTO.EN_COURS, result);
    }

    @Test
    public void getStatutStage_enCoursDateFinAujourdhui() throws Exception {
        EntenteStage entente = new EntenteStage();
        entente.setId(1L);
        entente.setDateDebut(LocalDate.now().minusDays(10));
        entente.setDateFin(LocalDate.now());

        when(ententeStageRepository.findById(1L)).thenReturn(Optional.of(entente));

        StatutStageDTO result = professeurService.getStatutStage(1L);

        assertEquals(StatutStageDTO.EN_COURS, result);
    }

    @Test
    public void getStatutStage_termine() throws Exception {
        EntenteStage entente = new EntenteStage();
        entente.setId(1L);
        entente.setDateDebut(LocalDate.now().minusDays(100));
        entente.setDateFin(LocalDate.now().minusDays(10));

        when(ententeStageRepository.findById(1L)).thenReturn(Optional.of(entente));

        StatutStageDTO result = professeurService.getStatutStage(1L);

        assertEquals(StatutStageDTO.TERMINE, result);
    }

    @Test
    public void getStatutStage_ententeNonTrouvee_lance() {
        when(ententeStageRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(EntenteNonTrouveeException.class, () ->
                professeurService.getStatutStage(99L)
        );
    }

    // ========== Tests pour creerEvaluationMilieuStage ==========

    @Test
    public void creerEvaluationMilieuStage_ententeNonTrouvee_lance() {
        Professeur professeur = new Professeur("prof@test.com", "hashedPass", "514-123-4567", "Dupont", "Pierre");
        when(professeurRepository.existsByEmail("prof@test.com")).thenReturn(true);
        when(professeurRepository.findByEmail("prof@test.com")).thenReturn(professeur);

        when(ententeStageRepository.findById(999L)).thenReturn(Optional.empty());

        CreerEvaluationMilieuStageDTO dto = new CreerEvaluationMilieuStageDTO();
        dto.setEntenteId(999L);

        assertThrows(EntenteNonTrouveException.class, () ->
                professeurService.creerEvaluationMilieuStage(dto)
        );

        verify(evaluationMilieuStageParProfesseurRepository, never()).save(any());
    }

    @Test
    public void creerEvaluationMilieuStage_ententeNonSignee_lance() {
        Professeur professeur = new Professeur("prof@test.com", "hashedPass", "514-123-4567", "Dupont", "Pierre");
        when(professeurRepository.existsByEmail("prof@test.com")).thenReturn(true);
        when(professeurRepository.findByEmail("prof@test.com")).thenReturn(professeur);

        EntenteStage entente = new EntenteStage();
        entente.setId(100L);
        entente.setStatut(EntenteStage.StatutEntente.EN_ATTENTE);

        when(ententeStageRepository.findById(100L)).thenReturn(Optional.of(entente));

        CreerEvaluationMilieuStageDTO dto = new CreerEvaluationMilieuStageDTO();
        dto.setEntenteId(100L);

        assertThrows(EntenteNonFinaliseeException.class, () ->
                professeurService.creerEvaluationMilieuStage(dto)
        );

        verify(evaluationMilieuStageParProfesseurRepository, never()).save(any());
    }

    @Test
    public void creerEvaluationMilieuStage_evaluationDejaExistante_lance() {
        Professeur professeur = new Professeur("prof@test.com", "hashedPass", "514-123-4567", "Dupont", "Pierre");
        when(professeurRepository.existsByEmail("prof@test.com")).thenReturn(true);
        when(professeurRepository.findByEmail("prof@test.com")).thenReturn(professeur);

        EntenteStage entente = new EntenteStage();
        entente.setId(100L);
        entente.setStatut(EntenteStage.StatutEntente.SIGNEE);

        when(ententeStageRepository.findById(100L)).thenReturn(Optional.of(entente));
        when(evaluationMilieuStageParProfesseurRepository.existsByEntenteId(100L)).thenReturn(true);

        CreerEvaluationMilieuStageDTO dto = new CreerEvaluationMilieuStageDTO();
        dto.setEntenteId(100L);

        assertThrows(EvaluationDejaExistanteException.class, () ->
                professeurService.creerEvaluationMilieuStage(dto)
        );

        verify(evaluationMilieuStageParProfesseurRepository, never()).save(any());
    }

    @Test
    public void creerEvaluationMilieuStage_professeurNonSuperviseur_lance() {
        Professeur professeur = mock(Professeur.class);
        when(professeur.getId()).thenReturn(1L);
        when(professeurRepository.existsByEmail("prof@test.com")).thenReturn(true);
        when(professeurRepository.findByEmail("prof@test.com")).thenReturn(professeur);

        // Autre professeur assigné à l'étudiant
        Professeur autreProfesseur = mock(Professeur.class);
        when(autreProfesseur.getId()).thenReturn(999L);

        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getProfesseur()).thenReturn(autreProfesseur);

        EntenteStage entente = mock(EntenteStage.class);
        when(entente.getEtudiant()).thenReturn(etudiant);
        when(entente.getStatut()).thenReturn(EntenteStage.StatutEntente.SIGNEE);

        when(ententeStageRepository.findById(100L)).thenReturn(Optional.of(entente));
        when(evaluationMilieuStageParProfesseurRepository.existsByEntenteId(100L)).thenReturn(false);

        CreerEvaluationMilieuStageDTO dto = new CreerEvaluationMilieuStageDTO();
        dto.setEntenteId(100L);

        assertThrows(ActionNonAutoriseeException.class, () ->
                professeurService.creerEvaluationMilieuStage(dto)
        );

        verify(evaluationMilieuStageParProfesseurRepository, never()).save(any());
    }

    @Test
    public void creerEvaluationMilieuStage_etudiantSansProfesseur_lance() {
        Professeur professeur = mock(Professeur.class);
        when(professeurRepository.existsByEmail("prof@test.com")).thenReturn(true);
        when(professeurRepository.findByEmail("prof@test.com")).thenReturn(professeur);

        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getProfesseur()).thenReturn(null); // Pas de professeur assigné

        EntenteStage entente = mock(EntenteStage.class);
        when(entente.getEtudiant()).thenReturn(etudiant);
        when(entente.getStatut()).thenReturn(EntenteStage.StatutEntente.SIGNEE);

        when(ententeStageRepository.findById(100L)).thenReturn(Optional.of(entente));
        when(evaluationMilieuStageParProfesseurRepository.existsByEntenteId(100L)).thenReturn(false);

        CreerEvaluationMilieuStageDTO dto = new CreerEvaluationMilieuStageDTO();
        dto.setEntenteId(100L);

        assertThrows(ActionNonAutoriseeException.class, () ->
                professeurService.creerEvaluationMilieuStage(dto)
        );

        verify(evaluationMilieuStageParProfesseurRepository, never()).save(any());
    }

    // ========== Tests pour getEvaluationsMilieuStagePourProfesseur ==========

    @Test
    public void getEvaluationsMilieuStagePourProfesseur_retourneListe() throws Exception {
        Professeur professeur = mock(Professeur.class);
        when(professeur.getId()).thenReturn(1L);
        when(professeurRepository.existsByEmail("prof@test.com")).thenReturn(true);
        when(professeurRepository.findByEmail("prof@test.com")).thenReturn(professeur);

        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getNom()).thenReturn("Martin");
        when(etudiant.getPrenom()).thenReturn("Sophie");

        Employeur employeur = mock(Employeur.class);
        when(employeur.getNomEntreprise()).thenReturn("Entreprise ABC");

        EvaluationMilieuStageParProfesseur eval1 = new EvaluationMilieuStageParProfesseur();
        eval1.setProfesseur(professeur);
        eval1.setEtudiant(etudiant);
        eval1.setEmployeur(employeur);

        EvaluationMilieuStageParProfesseur eval2 = new EvaluationMilieuStageParProfesseur();
        eval2.setProfesseur(professeur);
        eval2.setEtudiant(etudiant);
        eval2.setEmployeur(employeur);

        when(evaluationMilieuStageParProfesseurRepository.findAllByProfesseurId(1L))
                .thenReturn(asList(eval1, eval2));

        List<EvaluationMilieuStageDTO> result = professeurService.getEvaluationsMilieuStagePourProfesseur();

        assertEquals(2, result.size());
    }

    @Test
    public void getEvaluationsMilieuStagePourProfesseur_listeVide() throws Exception {
        Professeur professeur = mock(Professeur.class);
        when(professeur.getId()).thenReturn(1L);
        when(professeurRepository.existsByEmail("prof@test.com")).thenReturn(true);
        when(professeurRepository.findByEmail("prof@test.com")).thenReturn(professeur);

        when(evaluationMilieuStageParProfesseurRepository.findAllByProfesseurId(1L))
                .thenReturn(Collections.emptyList());

        List<EvaluationMilieuStageDTO> result = professeurService.getEvaluationsMilieuStagePourProfesseur();

        assertTrue(result.isEmpty());
    }

    // ========== Tests pour getEvaluationMilieuStageSpecifique ==========

    @Test
    public void getEvaluationMilieuStageSpecifique_retourneEvaluation() throws Exception {
        Professeur professeur = mock(Professeur.class);
        when(professeur.getId()).thenReturn(1L);
        when(professeurRepository.existsByEmail("prof@test.com")).thenReturn(true);
        when(professeurRepository.findByEmail("prof@test.com")).thenReturn(professeur);

        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getNom()).thenReturn("Martin");
        when(etudiant.getPrenom()).thenReturn("Sophie");

        Employeur employeur = mock(Employeur.class);
        when(employeur.getNomEntreprise()).thenReturn("Entreprise ABC");

        EvaluationMilieuStageParProfesseur evaluation = new EvaluationMilieuStageParProfesseur();
        evaluation.setProfesseur(professeur);
        evaluation.setEtudiant(etudiant);
        evaluation.setEmployeur(employeur);
        evaluation.setQualiteEncadrement("Excellent");

        when(evaluationMilieuStageParProfesseurRepository.findById(1L))
                .thenReturn(Optional.of(evaluation));

        EvaluationMilieuStageDTO result = professeurService.getEvaluationMilieuStageSpecifique(1L);

        assertNotNull(result);
        assertEquals("Excellent", result.getQualiteEncadrement());
    }

    @Test
    public void getEvaluationMilieuStageSpecifique_evaluationNonTrouvee_lance() {
        Professeur professeur = new Professeur("prof@test.com", "hashedPass", "514-123-4567", "Dupont", "Pierre");
        when(professeurRepository.existsByEmail("prof@test.com")).thenReturn(true);
        when(professeurRepository.findByEmail("prof@test.com")).thenReturn(professeur);

        when(evaluationMilieuStageParProfesseurRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () ->
                professeurService.getEvaluationMilieuStageSpecifique(999L)
        );
    }

    @Test
    public void getEvaluationMilieuStageSpecifique_professeurNonProprietaire_lance() {
        Professeur professeur = mock(Professeur.class);
        when(professeur.getId()).thenReturn(1L);
        when(professeurRepository.existsByEmail("prof@test.com")).thenReturn(true);
        when(professeurRepository.findByEmail("prof@test.com")).thenReturn(professeur);

        Professeur autreProfesseur = mock(Professeur.class);
        when(autreProfesseur.getId()).thenReturn(999L);

        EvaluationMilieuStageParProfesseur evaluation = new EvaluationMilieuStageParProfesseur();
        evaluation.setProfesseur(autreProfesseur); // Évaluation d'un autre professeur

        when(evaluationMilieuStageParProfesseurRepository.findById(1L))
                .thenReturn(Optional.of(evaluation));

        assertThrows(ActionNonAutoriseeException.class, () ->
                professeurService.getEvaluationMilieuStageSpecifique(1L)
        );
    }

    // ========== Tests pour getEvaluationMilieuStagePdf ==========

    @Test
    public void getEvaluationMilieuStagePdf_retournePdf() throws Exception {
        Professeur professeur = mock(Professeur.class);
        when(professeur.getId()).thenReturn(1L);
        when(professeurRepository.existsByEmail("prof@test.com")).thenReturn(true);
        when(professeurRepository.findByEmail("prof@test.com")).thenReturn(professeur);

        String pdfBase64 = Base64.getEncoder().encodeToString("PDF content".getBytes());

        EvaluationMilieuStageParProfesseur evaluation = new EvaluationMilieuStageParProfesseur();
        evaluation.setProfesseur(professeur);
        evaluation.setPdfBase64(pdfBase64);

        when(evaluationMilieuStageParProfesseurRepository.findById(1L))
                .thenReturn(Optional.of(evaluation));

        byte[] result = professeurService.getEvaluationMilieuStagePdf(1L);

        assertNotNull(result);
        assertArrayEquals("PDF content".getBytes(), result);
    }

    @Test
    public void getEvaluationMilieuStagePdf_professeurNonProprietaire_lance() {
        Professeur professeur = mock(Professeur.class);
        when(professeur.getId()).thenReturn(1L);
        when(professeurRepository.existsByEmail("prof@test.com")).thenReturn(true);
        when(professeurRepository.findByEmail("prof@test.com")).thenReturn(professeur);

        Professeur professeur2 = mock(Professeur.class);
        when(professeur.getId()).thenReturn(1L);
        when(professeurRepository.existsByEmail("prof@test.com")).thenReturn(true);
        when(professeurRepository.findByEmail("prof@test.com")).thenReturn(professeur);

        EvaluationMilieuStageParProfesseur evaluation = new EvaluationMilieuStageParProfesseur();
        evaluation.setId(1L);
        evaluation.setProfesseur(professeur2);
        evaluation.setPdfBase64("base64string");

        when(evaluationMilieuStageParProfesseurRepository.findById(1L))
                .thenReturn(Optional.of(evaluation));

        assertThrows(ActionNonAutoriseeException.class, () ->
                professeurService.getEvaluationMilieuStagePdf(1L)
        );
    }
}