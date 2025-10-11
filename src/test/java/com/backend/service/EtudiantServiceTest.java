package com.backend.service;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.modele.*;
import com.backend.persistence.CandidatureRepository;
import com.backend.persistence.UtilisateurRepository;
import com.backend.service.DTO.CandidatureDTO;
import com.backend.util.EncryptageCV;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.Exceptions.UtilisateurPasTrouveException;
import com.backend.persistence.EtudiantRepository;
import com.backend.persistence.OffreRepository;
import com.backend.service.DTO.OffreDTO;
import com.backend.service.DTO.ProgrammeDTO;
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

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EtudiantServiceTest {
    @Mock
    private EtudiantRepository etudiantRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UtilisateurRepository  utilisateurRepository;

    @Mock
    private OffreRepository offreRepository;

    @Mock
    private EncryptageCV encryptageCV;

    @InjectMocks
    private EtudiantService etudiantService;

    @Mock
    private CandidatureRepository candidatureRepository;

    @BeforeEach
    void setupSecurityContext() {
        Authentication auth = mock(Authentication.class);
        Collection<GrantedAuthority> authorities =
                Collections.singletonList(new SimpleGrantedAuthority("ETUDIANT"));

        lenient().when(auth.getAuthorities()).thenReturn((Collection) authorities);
        lenient().when(auth.getName()).thenReturn("etudiant@test.com");

        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(auth);

        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    public void testCreationEtudiant() throws MotPasseInvalideException {
        // Arrange
        Etudiant etudiant = new Etudiant( "etudiant@example.com", "Etudiant128&", "987-654-3210", "Martin", "Durand", Programme.P388_A1, "Automne", "2025");
        when(utilisateurRepository.existsByEmail(etudiant.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(any(CharSequence.class))).thenReturn("encodedPassword");
        when(etudiantRepository.save(any(Etudiant.class))).thenReturn(etudiant);

        //Act
        etudiantService.creerEtudiant(etudiant.getEmail(), etudiant.getPassword(), etudiant.getTelephone(), etudiant.getPrenom(), etudiant.getNom(),  ProgrammeDTO.P388_A1, etudiant.getSession(), etudiant.getAnnee());

        //Assert
        verify(etudiantRepository, times(1)).save(any(Etudiant.class));
    }

    @Test
    public void testCreationEtudiant_MotDePasseInvalide() {
        // Arrange
        Etudiant etudiant = new Etudiant( "etudiant@example.com", "abc", "987-654-3210", "Martin", "Durand", Programme.P388_A1, "Automne", "2025");
        when(utilisateurRepository.existsByEmail(etudiant.getEmail())).thenReturn(false);

        // Act & Assert
        assertThrows(
                MotPasseInvalideException.class,
                () -> etudiantService.creerEtudiant(etudiant.getEmail(), etudiant.getPassword(), etudiant.getTelephone(), etudiant.getPrenom(), etudiant.getNom(),  ProgrammeDTO.P388_A1, etudiant.getSession(), etudiant.getAnnee())
        );
    }

    @Test
    public void testCreationEtudiant_DeuxComptesMemeEmail() throws MotPasseInvalideException {
        // Arrange
        String email = "mon@etudiant.com";
        Etudiant etudiant = new Etudiant(email, "Etudiant128&", "987-654-3210", "Martin", "Durand", Programme.P200_B1, "Automne", "2025");
        when(utilisateurRepository.existsByEmail(email)).thenReturn(false);
        when(passwordEncoder.encode(any(CharSequence.class))).thenReturn("encodedPassword");
        when(etudiantRepository.save(any(Etudiant.class))).thenReturn(etudiant);

        // Premier compte créé sans exception
        etudiantService.creerEtudiant(etudiant.getEmail(), etudiant.getPassword(), etudiant.getTelephone(), etudiant.getPrenom(), etudiant.getNom(),  ProgrammeDTO.P200_B1, etudiant.getSession(), etudiant.getAnnee());

        // Simule que l'email existe déjà pour le deuxième compte
        when(utilisateurRepository.existsByEmail(email)).thenReturn(true);

        // Act & Assert
        assertThrows(
                com.backend.Exceptions.EmailDejaUtiliseException.class,
                () -> etudiantService.creerEtudiant(email, etudiant.getPassword(), etudiant.getTelephone(), etudiant.getPrenom(), etudiant.getNom(),  ProgrammeDTO.P200_B1, etudiant.getSession(), etudiant.getAnnee())
        );
    }

    @Test
    void getCvEtudiantConnecte_aucunEtudiant_throw() {
        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(false);

        assertThrows(UtilisateurPasTrouveException.class,
                () -> etudiantService.getCvEtudiantConnecte());
    }

    @Test
    void getCvEtudiantConnecte_aucunCv_throw() {
        Etudiant etudiant = new Etudiant();
        etudiant.setEmail("etudiant@test.com");
        etudiant.setCv(null);

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);

        assertThrows(RuntimeException.class,
                () -> etudiantService.getCvEtudiantConnecte(),
                "Doit lancer une exception car aucun CV n'est présent");
    }

    @Test
    void getCvEtudiantConnecte_roleNonAutorise_throw() {
        Authentication auth = mock(Authentication.class);
        when(auth.getAuthorities()).thenReturn(Collections.emptyList());

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        assertThrows(ActionNonAutoriseeException.class,
                () -> etudiantService.getCvEtudiantConnecte());
    }

    @Test
    void getCvEtudiantConnecte_succesMockDechiffrement() throws Exception {
        // Arrange
        Etudiant etudiant = new Etudiant();
        etudiant.setEmail("etudiant@test.com");
        etudiant.setCv("fakeChiffre".getBytes());

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);

        when(encryptageCV.dechiffrer(anyString())).thenReturn("CV en bytes".getBytes());

        // Act
        var cvDTO = etudiantService.getCvEtudiantConnecte();

        // Assert
        assertNotNull(cvDTO);
        assertArrayEquals("CV en bytes".getBytes(), cvDTO.getCv());
    }



    @Test
    public void testGetOffresApprouve() {
        // Arrange
        Employeur employeur = new Employeur("employeur@example.com", "encodedPassword", "514-123-4567", "Tech Corp", "John Doe");

        Offre offre1 = new Offre(
                "Stage en développement web",
                "Développement d'applications web",
                LocalDate.of(2025, 5, 1),
                LocalDate.of(2025, 8, 31),
                Programme.P420_B0,
                "Montréal",
                "20$/h",
                LocalDate.of(2025, 4, 15),
                employeur
        );
        offre1.setStatutApprouve(Offre.StatutApprouve.APPROUVE);

        Offre offre2 = new Offre(
                "Stage en réseaux",
                "Administration de réseaux",
                LocalDate.of(2025, 6, 1),
                LocalDate.of(2025, 9, 30),
                Programme.P420_B0,
                "Québec",
                "22$/h",
                LocalDate.of(2025, 5, 1),
                employeur
        );
        offre2.setStatutApprouve(Offre.StatutApprouve.APPROUVE);

        // Offre refusée (ne devrait pas apparaître dans les résultats)
        Offre offre3 = new Offre(
                "Stage refusé",
                "Description",
                LocalDate.of(2025, 5, 1),
                LocalDate.of(2025, 8, 31),
                Programme.P420_B0,
                "Laval",
                "18$/h",
                LocalDate.of(2025, 4, 1),
                employeur
        );
        offre3.setStatutApprouve(Offre.StatutApprouve.REFUSE);

        List<Offre> offresApprouvees = List.of(offre1, offre2);

        when(offreRepository.findAllByStatutApprouve(Offre.StatutApprouve.APPROUVE))
                .thenReturn(offresApprouvees);

        // Act
        List<OffreDTO> result = etudiantService.getOffresApprouves();

        // Assert
        verify(offreRepository, times(1)).findAllByStatutApprouve(Offre.StatutApprouve.APPROUVE);
        org.junit.jupiter.api.Assertions.assertEquals(2, result.size());
        org.junit.jupiter.api.Assertions.assertEquals("Stage en développement web", result.get(0).getTitre());
        org.junit.jupiter.api.Assertions.assertEquals("Stage en réseaux", result.get(1).getTitre());
    }

    @Test
    public void testGetOffresApprouve_AucuneOffre() {
        // Arrange
        when(offreRepository.findAllByStatutApprouve(Offre.StatutApprouve.APPROUVE))
                .thenReturn(List.of());

        // Act
        List<OffreDTO> result = etudiantService.getOffresApprouves();

        // Assert
        verify(offreRepository, times(1)).findAllByStatutApprouve(Offre.StatutApprouve.APPROUVE);
        org.junit.jupiter.api.Assertions.assertTrue(result.isEmpty());
        org.junit.jupiter.api.Assertions.assertEquals(0, 0);
    }

    @Test
    public void testPostulerOffre_Succes() throws Exception {
        // Arrange
        Etudiant etudiant = new Etudiant();
        etudiant.setEmail("etudiant@test.com");
        etudiant.setStatutCV(Etudiant.StatutCV.APPROUVE);

        Employeur employeur = new Employeur("employeur@example.com", "encodedPass", "514-000-0000", "TechCorp", "John Doe");

        Offre offre = new Offre();
        offre.setId(1L);
        offre.setStatutApprouve(Offre.StatutApprouve.APPROUVE);
        offre.setDateLimite(LocalDate.now().plusDays(5));
        offre.setEmployeur(employeur);

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(offreRepository.findById(1L)).thenReturn(java.util.Optional.of(offre));
        when(candidatureRepository.existsByEtudiantAndOffre(etudiant, offre)).thenReturn(false);
        when(encryptageCV.chiffrer(any())).thenReturn("chiffree");
        when(candidatureRepository.save(any(Candidature.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        var result = etudiantService.postulerOffre(1L, "Ma belle lettre");

        // Assert
        assertNotNull(result);
        verify(candidatureRepository, times(1)).save(any(Candidature.class));
    }


    @Test
    public void testPostulerOffre_CvNonApprouve_Throw() {
        // Arrange
        Etudiant etudiant = new Etudiant();
        etudiant.setEmail("etudiant@test.com");
        etudiant.setStatutCV(Etudiant.StatutCV.ATTENTE);

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);

        // Act & Assert
        assertThrows(IllegalStateException.class,
                () -> etudiantService.postulerOffre(1L, "Lettre"),
                "Doit refuser car le CV n'est pas approuvé");
    }

    @Test
    public void testGetMesCandidatures_Succes_Dechiffrement() throws Exception {
        // Arrange
        Etudiant etudiant = new Etudiant();
        etudiant.setEmail("etudiant@test.com");

        Employeur employeur = new Employeur("emp@test.com", "pass", "514-000-0000", "Corp", "Contact");
        Offre offre = new Offre();
        offre.setId(5L);
        offre.setEmployeur(employeur);

        Candidature candidature = new Candidature();
        candidature.setOffre(offre);
        candidature.setLettreMotivation("texteChiffre".getBytes(StandardCharsets.UTF_8));

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(candidatureRepository.findAllByEtudiant(etudiant)).thenReturn(List.of(candidature));
        when(encryptageCV.dechiffrer(anyString())).thenReturn("Lettre déchiffrée".getBytes(StandardCharsets.UTF_8));

        // Act
        List<CandidatureDTO> result = etudiantService.getMesCandidatures();

        // Assert
        assertEquals(1, result.size());
        assertEquals("Lettre déchiffrée", result.get(0).getLettreMotivation());
    }


    @Test
    public void testGetMesCandidatures_DechiffrementEchoue() throws Exception {
        // Arrange
        Etudiant etudiant = new Etudiant();
        etudiant.setEmail("etudiant@test.com");

        Employeur employeur = new Employeur("emp@test.com", "pass", "514-000-0000", "Corp", "Contact");
        Offre offre = new Offre();
        offre.setId(5L);
        offre.setEmployeur(employeur);

        Candidature candidature = new Candidature();
        candidature.setOffre(offre);
        candidature.setLettreMotivation("texteChiffre".getBytes(StandardCharsets.UTF_8));

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(candidatureRepository.findAllByEtudiant(etudiant)).thenReturn(List.of(candidature));
        when(encryptageCV.dechiffrer(anyString())).thenThrow(new RuntimeException("Erreur de déchiffrement"));

        // Act
        List<CandidatureDTO> result = etudiantService.getMesCandidatures();

        // Assert
        assertEquals(1, result.size());
        assertNull(result.get(0).getLettreMotivation());
    }


    @Test
    public void testRetirerCandidature_Succes() throws Exception {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);
        lenient().when(etudiant.getEmail()).thenReturn("etudiant@test.com");
        lenient().when(etudiant.getId()).thenReturn(1L);

        Candidature candidature = new Candidature();
        candidature.setStatut(Candidature.StatutCandidature.EN_ATTENTE);
        candidature.setEtudiant(etudiant);

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(candidatureRepository.findById(5L)).thenReturn(java.util.Optional.of(candidature));

        // Act
        etudiantService.retirerCandidature(5L);

        // Assert
        verify(candidatureRepository, times(1)).save(any(Candidature.class));
        assertEquals(Candidature.StatutCandidature.RETIREE, candidature.getStatut());
    }


    @Test
    public void testRetirerCandidature_MauvaisEtudiant_Throw() {
        // Arrange
        Etudiant etudiantConnecte = mock(Etudiant.class);
        Etudiant autreEtudiant = mock(Etudiant.class);

        lenient().when(etudiantConnecte.getEmail()).thenReturn("etudiant@test.com");
        lenient().when(etudiantConnecte.getId()).thenReturn(1L);
        lenient().when(autreEtudiant.getId()).thenReturn(2L);

        Candidature candidature = new Candidature();
        candidature.setStatut(Candidature.StatutCandidature.EN_ATTENTE);
        candidature.setEtudiant(autreEtudiant);

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiantConnecte);
        when(candidatureRepository.findById(3L)).thenReturn(java.util.Optional.of(candidature));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class,
                () -> etudiantService.retirerCandidature(3L));
    }


    @Test
    public void testAPostuleOffre_Succes() throws Exception {
        // Arrange
        Etudiant etudiant = new Etudiant();
        etudiant.setEmail("etudiant@test.com");

        Offre offre = new Offre();
        offre.setId(1L);

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(offreRepository.findById(1L)).thenReturn(java.util.Optional.of(offre));
        when(candidatureRepository.existsByEtudiantAndOffre(etudiant, offre)).thenReturn(true);

        // Act
        boolean result = etudiantService.aPostuleOffre(1L);

        // Assert
        assertTrue(result);
        verify(candidatureRepository, times(1)).existsByEtudiantAndOffre(etudiant, offre);
    }

    @Test
    public void testAPostuleOffre_OffreNonTrouvee_Throw() {
        // Arrange
        Etudiant etudiant = new Etudiant();
        etudiant.setEmail("etudiant@test.com");

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(offreRepository.findById(99L)).thenReturn(java.util.Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> etudiantService.aPostuleOffre(99L));
    }


}
