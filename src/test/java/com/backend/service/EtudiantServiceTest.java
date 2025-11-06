package com.backend.service;

import com.backend.Exceptions.*;
import com.backend.modele.*;
import com.backend.persistence.*;
import com.backend.service.DTO.*;
import com.backend.util.EncryptageCV;
import com.backend.modele.Notification;
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

    @Mock
    private SecurityContext securityContext;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private EtudiantService etudiantService;

    @Mock
    private EntenteStageRepository ententeStageRepository;

    @Mock
    private CandidatureRepository candidatureRepository;

    @Mock
    private Authentication authentication;

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
    public void testGetNotificationsPourEtudiantConnecte_returnsList() throws Exception {
        // Arrange
        Etudiant etu = new Etudiant();
        etu.setEmail("etudiant@test.com");

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etu);

        Notification n = new Notification();
        n.setId(7L);
        n.setUtilisateur(etu);
        n.setMessageKey("notif.key");
        n.setMessageParam("param");
        n.setLu(false);
        n.setDateCreation(LocalDateTime.now());

        when(notificationRepository.findAllByUtilisateurAndLuFalseOrderByDateCreationDesc(etu)).thenReturn(List.of(n));

        // Act
        var dtos = etudiantService.getNotificationsPourEtudiantConnecte();

        // Assert
        assertNotNull(dtos);
        assertEquals(1, dtos.size());
        NotificationDTO dto = dtos.get(0);
        assertEquals(7L, dto.getId());
        assertEquals("notif.key", dto.getMessageKey());
        assertEquals("param", dto.getMessageParam());
        assertFalse(dto.isLu());
    }

    @Test
    public void testGetNotificationsPourEtudiantConnecte_notForConnectedEtudiant_returnsEmpty() throws Exception {
        // Arrange
        String email = "etudiant@test.com";
        Etudiant etu = mock(Etudiant.class);
        etu.setEmail(email);


        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ETUDIANT")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(etudiantRepository.existsByEmail(email)).thenReturn(true);
        when(etudiantRepository.findByEmail(email)).thenReturn(etu);

        Etudiant autre = mock(Etudiant.class);

        Notification n = new Notification();
        n.setId(7L);
        n.setUtilisateur(autre); // appartient à un autre étudiant
        n.setMessageKey("notif.key");
        n.setMessageParam("param");
        n.setLu(false);
        n.setDateCreation(LocalDateTime.now());

        // Le dépôt ne doit pas retourner la notification de l'autre étudiant pour 'etu'
        when(notificationRepository.findAllByUtilisateurAndLuFalseOrderByDateCreationDesc(etu)).thenReturn(Collections.emptyList());

        // Act
        var dtos = etudiantService.getNotificationsPourEtudiantConnecte();

        // Assert
        assertNotNull(dtos);
        assertTrue(dtos.isEmpty());
    }

    @Test
    public void testMarquerNotificationLu_success() throws Exception {
        // Arrange
        Etudiant etu = mock(Etudiant.class);
        etu.setEmail("etudiant@test.com");
        when(etu.getId()).thenReturn(60L);

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etu);

        Notification notif = new Notification();
        notif.setId(8L);
        notif.setUtilisateur(etu);
        notif.setLu(false);

        when(notificationRepository.findById(8L)).thenReturn(Optional.of(notif));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        var result = etudiantService.marquerNotificationLu(8L, true);

        // Assert
        assertNotNull(result);
        assertEquals(8L, result.getId());
        assertTrue(result.isLu());
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    public void testMarquerNotificationLu_unauthorized() throws Exception {
        // Arrange
        Etudiant etu = mock(Etudiant.class);
        etu.setEmail("etudiant@test.com");
        when(etu.getId()).thenReturn(70L);

        when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etu);

        Etudiant autre = mock(Etudiant.class);
        when(autre.getId()).thenReturn(99L);

        Notification notif = new Notification();
        notif.setId(9L);
        notif.setUtilisateur(autre);
        notif.setLu(false);

        when(notificationRepository.findById(9L)).thenReturn(Optional.of(notif));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class, () -> etudiantService.marquerNotificationLu(9L, true));
        verify(notificationRepository, never()).save(any());
    }

    @Test
    public void testCreationEtudiant() throws MotPasseInvalideException, EmailDejaUtiliseException {
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
    public void testCreationEtudiant_DeuxComptesMemeEmail() throws MotPasseInvalideException, EmailDejaUtiliseException {
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

        assertThrows(CVNonExistantException.class,
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

    @Test
    void accepterOffreApprouvee_succes() throws Exception {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(1L);

        lenient().when(etudiantRepository.existsByEmail(anyString())).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail(anyString())).thenReturn(etudiant);

        Candidature candidature = new Candidature();
        candidature.setId(10L);
        candidature.setEtudiant(etudiant);
        candidature.setStatut(Candidature.StatutCandidature.ACCEPTEE);

        when(candidatureRepository.findById(10L)).thenReturn(Optional.of(candidature));

        // Act
        etudiantService.accepterOffreApprouvee(10L);

        // Assert
        assertEquals(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT, candidature.getStatut());
        verify(candidatureRepository, times(1)).save(candidature);
    }


    @Test
    void accepterOffreApprouvee_candidatureNonTrouvee_throw() {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);
        lenient().when(etudiant.getEmail()).thenReturn("etudiant@test.com");
        lenient().when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);

        // This is the essential stub that causes the failure we are testing:
        when(candidatureRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CandidatureNonDisponibleException.class,
                () -> etudiantService.accepterOffreApprouvee(99L));

        // Assert that save was never called
        verify(candidatureRepository, never()).save(any());
    }

    @Test
    void accepterOffreApprouvee_actionNonAutorisee_throw() {
        // Arrange
        Etudiant etudiantConnecte = mock(Etudiant.class);
        when(etudiantConnecte.getId()).thenReturn(1L);
        lenient().when(etudiantConnecte.getEmail()).thenReturn("etudiant@test.com");

        Etudiant autreEtudiant = mock(Etudiant.class);
        when(autreEtudiant.getId()).thenReturn(2L);

        Candidature candidature = new Candidature();
        candidature.setEtudiant(autreEtudiant);

        lenient().when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiantConnecte);

        when(candidatureRepository.findById(10L)).thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class,
                () -> etudiantService.accepterOffreApprouvee(10L));

        verify(candidatureRepository, never()).save(any());
    }

    @Test
    void accepterOffreApprouvee_statutInvalide_throw() {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(1L);

        lenient().when(etudiant.getEmail()).thenReturn("etudiant@test.com");

        Candidature candidature = new Candidature();
        candidature.setEtudiant(etudiant);
        candidature.setStatut(Candidature.StatutCandidature.EN_ATTENTE); // Statut invalide pour l'action

        lenient().when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);

        when(candidatureRepository.findById(10L)).thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(StatutCandidatureInvalideException.class,
                () -> etudiantService.accepterOffreApprouvee(10L));

        verify(candidatureRepository, never()).save(any());
    }



    @Test
    void refuserOffreApprouvee_succes() throws Exception {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(1L);
        lenient().when(etudiant.getEmail()).thenReturn("etudiant@test.com");

        Candidature candidature = new Candidature();
        candidature.setId(20L);
        candidature.setEtudiant(etudiant);
        candidature.setStatut(Candidature.StatutCandidature.ACCEPTEE);

        lenient().when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);

        when(candidatureRepository.findById(20L)).thenReturn(Optional.of(candidature));

        // Act
        etudiantService.refuserOffreApprouvee(20L);

        // Assert
        assertEquals(Candidature.StatutCandidature.REFUSEE_PAR_ETUDIANT, candidature.getStatut());
        verify(candidatureRepository, times(1)).save(candidature);
    }


    @Test
    void refuserOffreApprouvee_candidatureNonTrouvee_throw() {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);
        lenient().when(etudiant.getEmail()).thenReturn("etudiant@test.com");

        lenient().when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);

        when(candidatureRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CandidatureNonDisponibleException.class,
                () -> etudiantService.refuserOffreApprouvee(99L));
        verify(candidatureRepository, never()).save(any());
    }

    @Test
    void refuserOffreApprouvee_actionNonAutorisee_throw() {
        // Arrange
        Etudiant etudiantConnecte = mock(Etudiant.class);
        when(etudiantConnecte.getId()).thenReturn(1L);
        lenient().when(etudiantConnecte.getEmail()).thenReturn("etudiant@test.com");

        Etudiant autreEtudiant = mock(Etudiant.class);
        when(autreEtudiant.getId()).thenReturn(2L);

        Candidature candidature = new Candidature();
        candidature.setEtudiant(autreEtudiant);

        lenient().when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiantConnecte);

        when(candidatureRepository.findById(20L)).thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class,
                () -> etudiantService.refuserOffreApprouvee(20L));
        verify(candidatureRepository, never()).save(any());
    }


    @Test
    void refuserOffreApprouvee_statutInvalide_throw() {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(1L);
        lenient().when(etudiant.getEmail()).thenReturn("etudiant@test.com");

        Candidature candidature = new Candidature();
        candidature.setEtudiant(etudiant);
        candidature.setStatut(Candidature.StatutCandidature.REFUSEE); // Statut invalide pour l'action

        lenient().when(etudiantRepository.existsByEmail("etudiant@test.com")).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail("etudiant@test.com")).thenReturn(etudiant);

        when(candidatureRepository.findById(20L)).thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(StatutCandidatureInvalideException.class,
                () -> etudiantService.refuserOffreApprouvee(20L));
        verify(candidatureRepository, never()).save(any());
    }


    @Test
    void signerEntente_succes() throws Exception {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(1L);

        lenient().when(etudiantRepository.existsByEmail(anyString())).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail(anyString())).thenReturn(etudiant);

        EntenteStage entente = new EntenteStage();
        entente.setEtudiant(etudiant);
        entente.setEtudiantSignature(EntenteStage.SignatureStatus.EN_ATTENTE);
        entente.setEmployeurSignature(EntenteStage.SignatureStatus.EN_ATTENTE);
        entente.setStatut(EntenteStage.StatutEntente.EN_ATTENTE);

        when(ententeStageRepository.findById(10L)).thenReturn(Optional.of(entente));

        // Act
        etudiantService.signerEntente(10L);

        // Assert
        assertEquals(EntenteStage.SignatureStatus.SIGNEE, entente.getEtudiantSignature());
        assertEquals(EntenteStage.StatutEntente.EN_ATTENTE, entente.getStatut()); // Statut reste EN_ATTENTE car employeur n'a pas signé
        verify(ententeStageRepository, times(1)).save(entente);
    }

    @Test
    void signerEntente_ententeNonTrouvee_throw() {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);
        lenient().when(etudiantRepository.existsByEmail(anyString())).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail(anyString())).thenReturn(etudiant);

        when(ententeStageRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(EntenteNonTrouveeException.class,
                () -> etudiantService.signerEntente(99L));
        verify(ententeStageRepository, never()).save(any());
    }

    @Test
    void signerEntente_actionNonAutorisee_throw() {
        // Arrange
        Etudiant etudiantConnecte = mock(Etudiant.class);
        when(etudiantConnecte.getId()).thenReturn(1L);

        Etudiant autreEtudiant = mock(Etudiant.class);
        when(autreEtudiant.getId()).thenReturn(2L);

        lenient().when(etudiantRepository.existsByEmail(anyString())).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail(anyString())).thenReturn(etudiantConnecte);

        EntenteStage entente = new EntenteStage();
        entente.setEtudiant(autreEtudiant);
        entente.setEtudiantSignature(EntenteStage.SignatureStatus.EN_ATTENTE);

        when(ententeStageRepository.findById(10L)).thenReturn(Optional.of(entente));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class,
                () -> etudiantService.signerEntente(10L));
        verify(ententeStageRepository, never()).save(any());
    }

    @Test
    void signerEntente_statutInvalide_throw() {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(1L);

        lenient().when(etudiantRepository.existsByEmail(anyString())).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail(anyString())).thenReturn(etudiant);

        EntenteStage entente = new EntenteStage();
        entente.setEtudiant(etudiant);
        entente.setEtudiantSignature(EntenteStage.SignatureStatus.SIGNEE); // Déjà signée

        when(ententeStageRepository.findById(10L)).thenReturn(Optional.of(entente));

        // Act & Assert
        assertThrows(StatutEntenteInvalideException.class,
                () -> etudiantService.signerEntente(10L));
        verify(ententeStageRepository, never()).save(any());
    }

// Tests for refuserEntente

    @Test
    void refuserEntente_succes() throws Exception {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(1L);

        lenient().when(etudiantRepository.existsByEmail(anyString())).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail(anyString())).thenReturn(etudiant);

        EntenteStage entente = new EntenteStage();
        entente.setEtudiant(etudiant);
        entente.setEtudiantSignature(EntenteStage.SignatureStatus.EN_ATTENTE);
        entente.setStatut(EntenteStage.StatutEntente.EN_ATTENTE);

        when(ententeStageRepository.findById(10L)).thenReturn(Optional.of(entente));

        // Act
        etudiantService.refuserEntente(10L);

        // Assert
        assertEquals(EntenteStage.SignatureStatus.REFUSEE, entente.getEtudiantSignature());
        assertEquals(EntenteStage.StatutEntente.ANNULEE, entente.getStatut());
        verify(ententeStageRepository, times(1)).save(entente);
    }

    @Test
    void refuserEntente_ententeNonTrouvee_throw() {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);
        lenient().when(etudiantRepository.existsByEmail(anyString())).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail(anyString())).thenReturn(etudiant);

        when(ententeStageRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(EntenteNonTrouveeException.class,
                () -> etudiantService.refuserEntente(99L));
        verify(ententeStageRepository, never()).save(any());
    }

    @Test
    void refuserEntente_actionNonAutorisee_throw() {
        // Arrange
        Etudiant etudiantConnecte = mock(Etudiant.class);
        when(etudiantConnecte.getId()).thenReturn(1L);

        Etudiant autreEtudiant = mock(Etudiant.class);
        when(autreEtudiant.getId()).thenReturn(2L);

        lenient().when(etudiantRepository.existsByEmail(anyString())).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail(anyString())).thenReturn(etudiantConnecte);

        EntenteStage entente = new EntenteStage();
        entente.setEtudiant(autreEtudiant);

        when(ententeStageRepository.findById(10L)).thenReturn(Optional.of(entente));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class,
                () -> etudiantService.refuserEntente(10L));
        verify(ententeStageRepository, never()).save(any());
    }

    @Test
    void refuserEntente_statutInvalide_throw() {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(1L);

        lenient().when(etudiantRepository.existsByEmail(anyString())).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail(anyString())).thenReturn(etudiant);

        EntenteStage entente = new EntenteStage();
        entente.setEtudiant(etudiant);
        entente.setEtudiantSignature(EntenteStage.SignatureStatus.REFUSEE); // Déjà refusée

        when(ententeStageRepository.findById(10L)).thenReturn(Optional.of(entente));

        // Act & Assert
        assertThrows(StatutEntenteInvalideException.class,
                () -> etudiantService.refuserEntente(10L));
        verify(ententeStageRepository, never()).save(any());
    }

// Tests for getEntentesEnAttente

    @Test
    void getEntentesEnAttente_succes() throws Exception {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(1L);

        lenient().when(etudiantRepository.existsByEmail(anyString())).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail(anyString())).thenReturn(etudiant);

        Employeur employeur = new Employeur();
        Offre offre = new Offre();

        EntenteStage entente1 = new EntenteStage();
        entente1.setEtudiant(etudiant);
        entente1.setEmployeur(employeur);
        entente1.setOffre(offre);
        entente1.setEtudiantSignature(EntenteStage.SignatureStatus.EN_ATTENTE);
        entente1.setStatut(EntenteStage.StatutEntente.EN_ATTENTE);
        entente1.setArchived(false);

        EntenteStage entente2 = new EntenteStage();
        entente2.setEtudiant(etudiant);
        entente2.setEmployeur(employeur);
        entente2.setOffre(offre);
        entente2.setEtudiantSignature(EntenteStage.SignatureStatus.EN_ATTENTE);
        entente2.setStatut(EntenteStage.StatutEntente.EN_ATTENTE);
        entente2.setArchived(false);

        when(ententeStageRepository.findByEtudiantAndEtudiantSignatureAndArchivedFalse(
                etudiant, EntenteStage.SignatureStatus.EN_ATTENTE))
                .thenReturn(List.of(entente1, entente2));

        // Act
        List<EntenteStageDTO> result = etudiantService.getEntentesEnAttente();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
    }

    @Test
    void getEntentesEnAttente_aucuneEntente() throws Exception {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);

        lenient().when(etudiantRepository.existsByEmail(anyString())).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail(anyString())).thenReturn(etudiant);

        when(ententeStageRepository.findByEtudiantAndEtudiantSignatureAndArchivedFalse(
                etudiant, EntenteStage.SignatureStatus.EN_ATTENTE))
                .thenReturn(List.of());

        // Act
        List<EntenteStageDTO> result = etudiantService.getEntentesEnAttente();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

// Tests for getMesEntentes

    @Test
    void getMesEntentes_succes() throws Exception {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(1L);

        lenient().when(etudiantRepository.existsByEmail(anyString())).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail(anyString())).thenReturn(etudiant);

        Employeur employeur = new Employeur();
        Offre offre = new Offre();

        EntenteStage entente1 = new EntenteStage();
        entente1.setEtudiant(etudiant);
        entente1.setEmployeur(employeur);
        entente1.setOffre(offre);
        entente1.setEtudiantSignature(EntenteStage.SignatureStatus.EN_ATTENTE);
        entente1.setArchived(false);

        EntenteStage entente2 = new EntenteStage();
        entente2.setEtudiant(etudiant);
        entente2.setEmployeur(employeur);
        entente2.setOffre(offre);
        entente2.setEtudiantSignature(EntenteStage.SignatureStatus.SIGNEE);
        entente2.setArchived(false);

        EntenteStage entente3 = new EntenteStage();
        entente3.setEtudiant(etudiant);
        entente3.setEmployeur(employeur);
        entente3.setOffre(offre);
        entente3.setEtudiantSignature(EntenteStage.SignatureStatus.REFUSEE);
        entente3.setArchived(false);

        when(ententeStageRepository.findByEtudiantAndArchivedFalse(etudiant))
                .thenReturn(List.of(entente1, entente2, entente3));

        // Act
        List<EntenteStageDTO> result = etudiantService.getMesEntentes();

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
    }

    @Test
    void getMesEntentes_aucuneEntente() throws Exception {
        // Arrange
        Etudiant etudiant = mock(Etudiant.class);

        lenient().when(etudiantRepository.existsByEmail(anyString())).thenReturn(true);
        lenient().when(etudiantRepository.findByEmail(anyString())).thenReturn(etudiant);

        when(ententeStageRepository.findByEtudiantAndArchivedFalse(etudiant))
                .thenReturn(List.of());

        // Act
        List<EntenteStageDTO> result = etudiantService.getMesEntentes();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }
}
