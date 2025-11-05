package com.backend.service;

import com.backend.Exceptions.*;
import com.backend.modele.*;
import com.backend.persistence.*;
import com.backend.service.DTO.CandidatureDTO;
import com.backend.service.DTO.EntenteStageDTO;
import com.backend.service.DTO.EtudiantDTO;
import com.backend.service.DTO.StatutStageDTO;
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
        Etudiant etudiant = mock(Etudiant.class);
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
        Etudiant etudiant = mock(Etudiant.class);
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
}