package com.backend.service;

import com.backend.Exceptions.*;
import com.backend.modele.*;
import com.backend.persistence.CandidatureRepository;
import com.backend.persistence.UtilisateurRepository;
import com.backend.service.DTO.CandidatureDTO;
import com.backend.service.DTO.ConvocationEntrevueDTO;
import com.backend.util.EncryptageCV;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import java.util.List;
import java.util.Optional;

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
        Etudiant etudiant = new Etudiant();
        etudiant.setEmail("etudiant@test.com");
        etudiant.setStatutCV(Etudiant.StatutCV.APPROUVE);

        Employeur employeur = new Employeur("employeur@example.com", "encodedPass",
                "514-000-0000", "TechCorp", "John Doe");

        Offre offre = new Offre();
        offre.setId(1L);
        offre.setStatutApprouve(Offre.StatutApprouve.APPROUVE);
        offre.setDateLimite(LocalDate.now().plusDays(5));
        offre.setEmployeur(employeur);

        MockMultipartFile lettreFile = new MockMultipartFile(
                "lettreMotivation", "lettre.pdf", "application/pdf",
                "Contenu de la lettre".getBytes()
        );

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(offreRepository.findById(1L)).thenReturn(Optional.of(offre));
        when(candidatureRepository.existsByEtudiantAndOffre(etudiant, offre)).thenReturn(false);
        when(encryptageCV.chiffrer(any())).thenReturn("lettreChiffree");
        when(candidatureRepository.save(any(Candidature.class))).thenAnswer(inv -> inv.getArgument(0));

        var result = etudiantService.postulerOffre(1L, lettreFile);

        assertNotNull(result);
        verify(candidatureRepository, times(1)).save(any(Candidature.class));
    }

    @Test
    public void testPostulerOffre_CvNonApprouve_Throw() {
        // Arrange: student with CV not approved
        Etudiant etudiant = new Etudiant();
        etudiant.setEmail("etudiant@test.com");
        etudiant.setStatutCV(Etudiant.StatutCV.ATTENTE);

        MockMultipartFile lettreFile = new MockMultipartFile(
                "lettreMotivation", "lettre.pdf", "application/pdf",
                "Contenu de la lettre".getBytes()
        );

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);

        // Act & Assert: expect CvNonApprouveException
        CvNonApprouveException exception = assertThrows(
                CvNonApprouveException.class,
                () -> etudiantService.postulerOffre(1L, lettreFile)
        );

        assertEquals("Le CV n'a pas été approuvé", exception.getMessage());
    }



    @Test
    public void testGetMesCandidatures_Succes() throws Exception {
        Etudiant etudiant = mock(Etudiant.class);
        lenient().when(etudiant.getId()).thenReturn(1L);
        lenient().when(etudiant.getEmail()).thenReturn("etudiant@test.com");
        lenient().when(etudiant.getCv()).thenReturn("cvChiffre".getBytes());

        Employeur employeur = new Employeur("emp@test.com", "pass", "514-000-0000", "Corp", "Contact");

        Offre offre = new Offre();
        offre.setId(5L);
        offre.setTitre("Stage développement");
        offre.setEmployeur(employeur);

        Candidature candidature = new Candidature();
        candidature.setId(10L);
        candidature.setEtudiant(etudiant);
        candidature.setOffre(offre);
        candidature.setLettreMotivation("lettreChiffree".getBytes(StandardCharsets.UTF_8));

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(candidatureRepository.findAllByEtudiant(etudiant)).thenReturn(List.of(candidature));

        List<CandidatureDTO> result = etudiantService.getMesCandidatures();

        assertEquals(1, result.size());
        assertEquals(10L, result.get(0).getId());
        assertEquals("Stage développement", result.get(0).getOffreTitre());
        assertTrue(result.get(0).isACv());
        assertTrue(result.get(0).isALettreMotivation());
    }

    @Test
    public void testGetMesCandidatures_SansLettreMotivation() throws Exception {
        Etudiant etudiant = mock(Etudiant.class);
        lenient().when(etudiant.getId()).thenReturn(1L);
        lenient().when(etudiant.getEmail()).thenReturn("etudiant@test.com");
        lenient().when(etudiant.getCv()).thenReturn("cvChiffre".getBytes());

        Employeur employeur = new Employeur("emp@test.com", "pass", "514-000-0000", "Corp", "Contact");

        Offre offre = new Offre();
        offre.setId(5L);
        offre.setTitre("Stage développement");
        offre.setEmployeur(employeur);

        Candidature candidature = new Candidature();
        candidature.setId(10L);
        candidature.setEtudiant(etudiant);
        candidature.setOffre(offre);
        candidature.setLettreMotivation(null);

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(candidatureRepository.findAllByEtudiant(etudiant)).thenReturn(List.of(candidature));

        List<CandidatureDTO> result = etudiantService.getMesCandidatures();

        assertEquals(1, result.size());
        assertTrue(result.get(0).isACv());
        assertFalse(result.get(0).isALettreMotivation());
    }

    @Test
    public void testGetCvPourCandidature_Succes() throws Exception {
        Etudiant etudiant = mock(Etudiant.class);
        lenient().when(etudiant.getId()).thenReturn(1L);
        lenient().when(etudiant.getEmail()).thenReturn("etudiant@test.com");
        lenient().when(etudiant.getCv()).thenReturn("cvChiffre".getBytes());

        Candidature candidature = new Candidature();
        candidature.setId(5L);
        candidature.setEtudiant(etudiant);

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));
        when(encryptageCV.dechiffrer(anyString())).thenReturn("CV déchiffré".getBytes());

        byte[] result = etudiantService.getCvPourCandidature(5L);

        assertNotNull(result);
        assertArrayEquals("CV déchiffré".getBytes(), result);
    }

    @Test
    public void testGetCvPourCandidature_MauvaisEtudiant_Throw() {
        Etudiant etudiantConnecte = mock(Etudiant.class);
        Etudiant autreEtudiant = mock(Etudiant.class);

        lenient().when(etudiantConnecte.getId()).thenReturn(1L);
        lenient().when(etudiantConnecte.getEmail()).thenReturn("etudiant@test.com");
        lenient().when(autreEtudiant.getId()).thenReturn(2L);

        Candidature candidature = new Candidature();
        candidature.setId(5L);
        candidature.setEtudiant(autreEtudiant);

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiantConnecte);
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));

        assertThrows(ActionNonAutoriseeException.class,
                () -> etudiantService.getCvPourCandidature(5L));
    }

    @Test
    public void testGetLettreMotivationPourCandidature_Succes() throws Exception {
        Etudiant etudiant = mock(Etudiant.class);
        lenient().when(etudiant.getId()).thenReturn(1L);
        lenient().when(etudiant.getEmail()).thenReturn("etudiant@test.com");

        Candidature candidature = new Candidature();
        candidature.setId(5L);
        candidature.setEtudiant(etudiant);
        candidature.setLettreMotivation("lettreChiffree".getBytes(StandardCharsets.UTF_8));

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));
        when(encryptageCV.dechiffrer(anyString())).thenReturn("Lettre déchiffrée".getBytes());

        byte[] result = etudiantService.getLettreMotivationPourCandidature(5L);

        assertNotNull(result);
        assertArrayEquals("Lettre déchiffrée".getBytes(), result);
    }

    @Test
    public void testGetLettreMotivationPourCandidature_AucuneLettre_Throw() {
        // Arrange: mock student
        Etudiant etudiant = mock(Etudiant.class);
        lenient().when(etudiant.getId()).thenReturn(1L);
        lenient().when(etudiant.getEmail()).thenReturn("etudiant@test.com");

        Candidature candidature = new Candidature();
        candidature.setId(5L);
        candidature.setEtudiant(etudiant);
        candidature.setLettreMotivation(null);

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));

        // Act & Assert: expect LettreDeMotivationNonDisponibleException
        LettreDeMotivationNonDisponibleException exception = assertThrows(
                LettreDeMotivationNonDisponibleException.class,
                () -> etudiantService.getLettreMotivationPourCandidature(5L)
        );

        assertEquals("Lettre de motivation non disponible", exception.getMessage());
    }


    @Test
    public void testRetirerCandidature_Succes() throws Exception {
        Etudiant etudiant = mock(Etudiant.class);
        lenient().when(etudiant.getId()).thenReturn(1L);
        lenient().when(etudiant.getEmail()).thenReturn("etudiant@test.com");

        Candidature candidature = new Candidature();
        candidature.setStatut(Candidature.StatutCandidature.EN_ATTENTE);
        candidature.setEtudiant(etudiant);

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));

        etudiantService.retirerCandidature(5L);

        verify(candidatureRepository, times(1)).save(any(Candidature.class));
        assertEquals(Candidature.StatutCandidature.RETIREE, candidature.getStatut());
    }

    @Test
    public void testRetirerCandidature_MauvaisEtudiant_Throw() {
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
        when(candidatureRepository.findById(3L)).thenReturn(Optional.of(candidature));

        assertThrows(ActionNonAutoriseeException.class,
                () -> etudiantService.retirerCandidature(3L));
    }

    @Test
    public void testRetirerCandidature_StatutInvalide_Throw() {
        Etudiant etudiant = mock(Etudiant.class);
        lenient().when(etudiant.getId()).thenReturn(1L);
        lenient().when(etudiant.getEmail()).thenReturn("etudiant@test.com");

        Candidature candidature = new Candidature();
        candidature.setStatut(Candidature.StatutCandidature.ACCEPTEE);
        candidature.setEtudiant(etudiant);

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(candidatureRepository.findById(5L)).thenReturn(Optional.of(candidature));

        assertThrows(CandidatureNonDisponibleException.class,
                () -> etudiantService.retirerCandidature(5L),
                "Ne peut retirer qu'une candidature EN_ATTENTE");
    }

    @Test
    public void testAPostuleOffre_Succes() throws Exception {
        Etudiant etudiant = new Etudiant();
        etudiant.setEmail("etudiant@test.com");

        Offre offre = new Offre();
        offre.setId(1L);

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(offreRepository.findById(1L)).thenReturn(Optional.of(offre));
        when(candidatureRepository.existsByEtudiantAndOffre(etudiant, offre)).thenReturn(true);

        boolean result = etudiantService.aPostuleOffre(1L);

        assertTrue(result);
        verify(candidatureRepository, times(1)).existsByEtudiantAndOffre(etudiant, offre);
    }

    @Test
    public void testAPostuleOffre_OffreNonTrouvee_Throw() {
        Etudiant etudiant = new Etudiant();
        etudiant.setEmail("etudiant@test.com");

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(offreRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(OffreNonExistantException.class,
                () -> etudiantService.aPostuleOffre(99L));
    }

    @Test
    void getConvocationPourCandidature_success() throws Exception {
        // Création d'un vrai étudiant
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(1L);

        Offre offre = new Offre();

        // Candidature liée à l'étudiant
        Candidature candidature = new Candidature();
        candidature.setId(123L);
        candidature.setEtudiant(etudiant);
        candidature.setOffre(offre);

        ConvocationEntrevue convocation = new ConvocationEntrevue();
        convocation.setCandidature(candidature);
        convocation.setDateHeure(LocalDateTime.of(2025, 10, 20, 14, 0));
        convocation.setLieuOuLien("Zoom");
        convocation.setMessage("Merci de vous connecter à l’heure");

        candidature.setConvocationEntrevue(convocation);

        // Mock pour getEtudiantConnecte()
        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);
        when(candidatureRepository.findById(anyLong())).thenReturn(Optional.of(candidature));

        ConvocationEntrevueDTO result = etudiantService.getConvocationPourCandidature(1L);

        assertNotNull(result);
        assertEquals(convocation.getDateHeure(), result.getDateHeure());
        assertEquals("Zoom", result.getLieuOuLien());
        assertEquals("Merci de vous connecter à l’heure", result.getMessage());
    }

    @Test
    void getConvocationPourCandidature_nonTrouvee() {
        Long candidatureId = 2L;
        Etudiant etudiant = mock(Etudiant.class);

        // Simule qu'un étudiant existe avec cet email
        when(etudiantRepository.existsByEmail(anyString())).thenReturn(true);
        when(etudiantRepository.findByEmail(anyString())).thenReturn(etudiant);

        // Simule qu'aucune candidature n'est trouvée
        when(candidatureRepository.findById(candidatureId)).thenReturn(Optional.empty());

        assertThrows(ConvocationNonTrouveeException.class, () -> {
            etudiantService.getConvocationPourCandidature(candidatureId);
        });
    }

    @Test
    void getConvocationPourCandidature_actionNonAutorisee() {
        Long candidatureId = 3L;
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(1L);

        Etudiant autreEtudiant = mock(Etudiant.class);
        when(autreEtudiant.getId()).thenReturn(2L);

        Candidature candidature = new Candidature();
        candidature.setEtudiant(autreEtudiant);

        // Mock pour que l'étudiant connecté soit trouvé
        when(etudiantRepository.existsByEmail(anyString())).thenReturn(true);
        when(etudiantRepository.findByEmail(anyString())).thenReturn(etudiant);
        when(candidatureRepository.findById(candidatureId)).thenReturn(Optional.of(candidature));

        assertThrows(ActionNonAutoriseeException.class, () -> {
            etudiantService.getConvocationPourCandidature(candidatureId);
        });
    }
}
