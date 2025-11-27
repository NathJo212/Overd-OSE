package com.backend.service;

import com.backend.Exceptions.*;
import com.backend.config.JwtTokenProvider;
import com.backend.modele.*;
import com.backend.persistence.*;
import com.backend.service.DTO.*;
import com.backend.util.EncryptageCV;
import com.backend.util.PdfGenerationEvaluation;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmployeurServiceTest {
    @Mock
    private EmployeurRepository employeurRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private OffreRepository offreRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private EmployeurService employeurService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private EncryptageCV encryptageCV;

    @Mock
    private CandidatureRepository candidatureRepository;

    @Mock
    private ConvocationEntrevueRepository convocationEntrevueRepository;

    @Mock
    private Authentication authentication;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private EntenteStageRepository ententeStageRepository;

    @Mock
    private MessageSource messageSource;

    @Mock
    private PdfGenerationEvaluation pdfGenerationEvaluation;

    @Mock
    private EvaluationEtudiantParEmployeurRepository evaluationRepository;

    // Helper method to get current academic year
    private int getAnneeAcademiqueCourante() {
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        if (now.getMonthValue() >= 8) {
            return year + 1;
        }
        return year;
    }

    @Test
    public void testCreationEmployeur() throws MotPasseInvalideException, EmailDejaUtiliseException {
        // Arrange
        Employeur employeur = new Employeur("mon@employeur.com","Etudiant12?","(514) 582-9898","Gogole","Jaques L'heureux");
        when(utilisateurRepository.existsByEmail(employeur.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(any(CharSequence.class))).thenReturn("encodedPassword");
        when(employeurRepository.save(any(Employeur.class))).thenReturn(employeur);

        //Act
        employeurService.creerEmployeur(employeur.getEmail(), employeur.getPassword(), employeur.getTelephone(),  employeur.getNomEntreprise(), employeur.getContact());

        //Assert
        verify(employeurRepository, times(1)).save(any(Employeur.class));
    }

    @Test
    public void testCreationEmployeur_MotDePasseInvalide() {
        // Arrange
        Employeur employeur = new Employeur("mon@employeur.com", "abc", "(514) 582-9898", "Gogole", "Jaques L'heureux");
        when(utilisateurRepository.existsByEmail(employeur.getEmail())).thenReturn(false);

        // Act & Assert
        org.junit.jupiter.api.Assertions.assertThrows(
                MotPasseInvalideException.class,
                () -> employeurService.creerEmployeur(employeur.getEmail(), employeur.getPassword(), employeur.getTelephone(), employeur.getNomEntreprise(), employeur.getContact())
        );
    }

    @Test
    public void testCreationEmployeur_DeuxComptesMemeEmail() throws MotPasseInvalideException, EmailDejaUtiliseException {
        // Arrange
        String email = "mon@employeur.com";
        Employeur employeur1 = new Employeur(email, "Etudiant12?", "(514) 582-9898", "Gogole", "Jaques L'heureux");
        when(utilisateurRepository.existsByEmail(email)).thenReturn(false);
        when(passwordEncoder.encode(any(CharSequence.class))).thenReturn("encodedPassword");
        when(employeurRepository.save(any(Employeur.class))).thenReturn(employeur1);

        // Premier compte créé sans exception
        employeurService.creerEmployeur(email, employeur1.getPassword(), employeur1.getTelephone(), employeur1.getNomEntreprise(), employeur1.getContact());

        // Simule que l'email existe déjà pour le deuxième compte
        when(utilisateurRepository.existsByEmail(email)).thenReturn(true);

        // Act & Assert
        org.junit.jupiter.api.Assertions.assertThrows(
                EmailDejaUtiliseException.class,
                () -> employeurService.creerEmployeur(email, employeur1.getPassword(), employeur1.getTelephone(), employeur1.getNomEntreprise(), employeur1.getContact())
        );
    }

    @Test
    public void testCreerOffreDeStage_Succes() throws Exception {
        AuthResponseDTO utilisateur = new AuthResponseDTO("Bearer validToken");
        when(jwtTokenProvider.isEmployeur(anyString(), any(JwtTokenProvider.class))).thenReturn(true);
        when(jwtTokenProvider.getEmailFromJWT(anyString())).thenReturn("mon@employeur.com");
        Employeur employeur = new Employeur("mon@employeur.com", "pass", "tel", "nom", "contact");
        when(employeurRepository.findByEmail(anyString())).thenReturn(employeur);

        employeurService.creerOffreDeStage(utilisateur, "titre", "desc",
                LocalDate.of(getAnneeAcademiqueCourante(), 1, 6), LocalDate.of(getAnneeAcademiqueCourante(), 6, 1),
                ProgrammeDTO.P410_A1, "lieu", "rem", LocalDate.of(getAnneeAcademiqueCourante(), 1, 1), null, null, null, null, null, "allo");


        verify(offreRepository, times(1)).save(any(Offre.class));
    }

    @Test
    public void testCreerOffreDeStage_NonEmployeur() {
        AuthResponseDTO utilisateur = new AuthResponseDTO("Bearer fakeToken");
        when(jwtTokenProvider.isEmployeur(anyString(), any())).thenReturn(false);

        assertThrows(ActionNonAutoriseeException.class, () -> employeurService.creerOffreDeStage(utilisateur, "titre", "desc",
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 6, 1),
                ProgrammeDTO.P500_AF, "lieu", "rem", LocalDate.of(2024, 5, 1), null, null, null, null, null, "allo"));
    }

    @Test
    public void testGetOffresParEmployeur() throws Exception {
        // Arrange
        int anneeTest = getAnneeAcademiqueCourante();

        String email = "employeur@test.com";
        Employeur employeur = new Employeur(email, "pass", "tel", "nom", "contact");

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Offre offre1 = new Offre("Titre 1", "Description 1", LocalDate.of(anneeTest, 1, 1), LocalDate.of(anneeTest, 6, 1), Programme.P420_B0, "lieu", "rem", LocalDate.of(anneeTest, 5, 1), employeur);
        Offre offre2 = new Offre("Titre 2", "Description 2", LocalDate.of(anneeTest, 2, 1), LocalDate.of(anneeTest, 7, 1), Programme.P420_B0, "lieu", "rem", LocalDate.of(anneeTest, 6, 1), employeur);
        when(offreRepository.findOffreByEmployeurId(employeur.getId())).thenReturn(java.util.List.of(offre1, offre2));

        // Act
        var result = employeurService.getOffresParEmployeur(anneeTest);

        // Assert
        verify(employeurRepository, times(1)).findByEmail(email);
        verify(offreRepository, times(1)).findOffreByEmployeurId(employeur.getId());
        assertEquals(2, result.size());
    }

    @Test
    public void testGetOffresParEmployeur_NonEmployeur() {
        // Arrange
        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ETUDIANT")
        );
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class, () ->
                employeurService.getOffresParEmployeur(getAnneeAcademiqueCourante())
        );
    }

    @Test
    public void testGetEmployeurConnecte_Succes() throws Exception {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = new Employeur(email, "pass", "tel", "nom", "contact");

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );

        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        // Act
        Employeur result = employeurService.getEmployeurConnecte();

        // Assert
        assertNotNull(result);
        assertEquals(email, result.getEmail());
        verify(employeurRepository, times(1)).findByEmail(email);
    }

    @Test
    public void testGetEmployeurConnecte_NonEmployeur() {
        // Arrange
        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ETUDIANT")
        );

        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class, () -> employeurService.getEmployeurConnecte());
    }

    @Test
    public void testGetEmployeurConnecte_EmployeurNonTrouve() {
        // Arrange
        String email = "inexistant@test.com";
        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );

        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(null);

        // Act & Assert
        assertThrows(UtilisateurPasTrouveException.class, () -> employeurService.getEmployeurConnecte());
    }

    @Test
    public void testGetCandidaturesPourEmployeur_Succes() throws Exception {
        // Arrange
        int anneeTest = getAnneeAcademiqueCourante();
        String email = "employeur@test.com";
        Employeur employeur = new Employeur(email, "pass", "tel", "nom", "contact");

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );

        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Etudiant etudiant = new Etudiant("etudiant@test.com", "pass", "tel",
                "Jean", "Dupont", Programme.P420_B0);

        Offre offre1 = new Offre("Titre 1", "Description 1",
                LocalDate.of(anneeTest, 1, 1), LocalDate.of(anneeTest, 6, 1),
                Programme.P420_B0, "lieu", "rem", LocalDate.of(anneeTest, 5, 1), employeur);

        Offre offre2 = new Offre("Titre 2", "Description 2",
                LocalDate.of(anneeTest, 2, 1), LocalDate.of(anneeTest, 7, 1),
                Programme.P420_B0, "lieu", "rem", LocalDate.of(anneeTest, 6, 1), employeur);

        Candidature candidature1 = new Candidature(etudiant, offre1, null);
        Candidature candidature2 = new Candidature(etudiant, offre2, null);

        offre1.getCandidatures().add(candidature1);
        offre2.getCandidatures().add(candidature2);

        when(offreRepository.findOffreByEmployeurId(employeur.getId()))
                .thenReturn(Arrays.asList(offre1, offre2));

        // Act
        List<CandidatureDTO> result = employeurService.getCandidaturesPourEmployeur(anneeTest);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(offreRepository, times(1)).findOffreByEmployeurId(employeur.getId());
    }

    @Test
    public void testGetCandidaturesPourEmployeur_AucuneCandidature() throws Exception {
        // Arrange
        int anneeTest = getAnneeAcademiqueCourante();
        String email = "employeur@test.com";
        Employeur employeur = new Employeur(email, "pass", "tel", "nom", "contact");

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );

        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Offre offre = new Offre("Titre", "Description",
                LocalDate.of(anneeTest, 1, 1), LocalDate.of(anneeTest, 6, 1),
                Programme.P420_B0, "lieu", "rem", LocalDate.of(anneeTest, 5, 1), employeur);

        when(offreRepository.findOffreByEmployeurId(employeur.getId()))
                .thenReturn(Collections.singletonList(offre));

        // Act
        List<CandidatureDTO> result = employeurService.getCandidaturesPourEmployeur(anneeTest);

        // Assert
        assertNotNull(result);
        assertEquals(0, result.size());
    }

    @Test
    public void testGetCandidatureSpecifique_Succes() throws Exception {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = new Employeur(email, "pass", "tel", "nom", "contact");

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );

        lenient().when(authentication.getName()).thenReturn(email);
        lenient().when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        lenient().when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Etudiant etudiant = new Etudiant("etudiant@test.com", "pass", "tel",
                "Jean", "Dupont", Programme.P420_B0);

        Offre offre = new Offre("Titre", "Description",
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 6, 1),
                Programme.P420_B0, "lieu", "rem", LocalDate.of(2024, 5, 1), employeur);

        Candidature candidature = new Candidature(etudiant, offre, null);
        Long candidatureId = 1L;

        lenient().when(candidatureRepository.findById(candidatureId))
                .thenReturn(Optional.of(candidature));

        // Act
        CandidatureDTO result = employeurService.getCandidatureSpecifique(candidatureId);

        // Assert
        assertNotNull(result);
        verify(candidatureRepository, times(1)).findById(candidatureId);
    }

    @Test
    public void testGetCandidatureSpecifique_CandidatureNonTrouvee() {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = new Employeur(email, "pass", "tel", "nom", "contact");

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );

        lenient().when(authentication.getName()).thenReturn(email);
        lenient().when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        lenient().when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Long candidatureId = 999L;
        lenient().when(candidatureRepository.findById(candidatureId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CandidatureNonTrouveeException.class, () -> employeurService.getCandidatureSpecifique(candidatureId));
    }

    @Test
    public void testGetCvPourCandidature_Succes() throws Exception {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );

        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Etudiant etudiant = new Etudiant("etudiant@test.com", "pass", "tel",
                "Jean", "Dupont", Programme.P420_B0);

        String cvChiffre = "cvChiffreTest";
        etudiant.setCv(cvChiffre.getBytes(StandardCharsets.UTF_8));

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(employeur);

        Candidature candidature = new Candidature(etudiant, offre, null);
        Long candidatureId = 1L;

        when(candidatureRepository.findById(candidatureId))
                .thenReturn(Optional.of(candidature));

        byte[] cvDechiffre = "CV déchiffré".getBytes();
        when(encryptageCV.dechiffrer(cvChiffre)).thenReturn(cvDechiffre);

        // Act
        byte[] result = employeurService.getCvPourCandidature(candidatureId);

        // Assert
        assertNotNull(result);
        assertArrayEquals(cvDechiffre, result);
        verify(encryptageCV, times(1)).dechiffrer(cvChiffre);
    }

    @Test
    public void testGetCvPourCandidature_CandidatureNonTrouvee() {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = new Employeur(email, "pass", "tel", "nom", "contact");

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );

        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Long candidatureId = 999L;
        when(candidatureRepository.findById(candidatureId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CandidatureNonTrouveeException.class, () -> employeurService.getCvPourCandidature(candidatureId));
    }

    @Test
    public void testGetCvPourCandidature_NonAutorise() {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Employeur autreEmployeur = mock(Employeur.class);
        when(autreEmployeur.getId()).thenReturn(2L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );

        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Etudiant etudiant = new Etudiant("etudiant@test.com", "pass", "tel",
                "Jean", "Dupont", Programme.P420_B0);
        etudiant.setCv("cvChiffre".getBytes());

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(autreEmployeur);

        Candidature candidature = new Candidature(etudiant, offre, null);
        Long candidatureId = 1L;

        when(candidatureRepository.findById(candidatureId))
                .thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class, () -> employeurService.getCvPourCandidature(candidatureId));
    }

    @Test
    public void testGetCvPourCandidature_CvNonExistant() {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );

        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Etudiant etudiant = new Etudiant("etudiant@test.com", "pass", "tel",
                "Jean", "Dupont", Programme.P420_B0);
        // Pas de CV

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(employeur);

        Candidature candidature = new Candidature(etudiant, offre, null);
        Long candidatureId = 1L;

        when(candidatureRepository.findById(candidatureId))
                .thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(CVNonExistantException.class, () -> employeurService.getCvPourCandidature(candidatureId));
    }

    @Test
    public void testGetLettreMotivationPourCandidature_Succes() throws Exception {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );

        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Etudiant etudiant = new Etudiant("etudiant@test.com", "pass", "tel",
                "Jean", "Dupont", Programme.P420_B0);

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(employeur);

        String lettreChiffree = "lettreChiffreeTest";
        Candidature candidature = new Candidature(etudiant, offre,
                lettreChiffree.getBytes(StandardCharsets.UTF_8));
        Long candidatureId = 1L;

        when(candidatureRepository.findById(candidatureId))
                .thenReturn(Optional.of(candidature));

        byte[] lettreDechiffree = "Lettre déchiffrée".getBytes();
        when(encryptageCV.dechiffrer(lettreChiffree)).thenReturn(lettreDechiffree);

        // Act
        byte[] result = employeurService.getLettreMotivationPourCandidature(candidatureId);

        // Assert
        assertNotNull(result);
        assertArrayEquals(lettreDechiffree, result);
        verify(encryptageCV, times(1)).dechiffrer(lettreChiffree);
    }


    @Test
    public void testGetLettreMotivationPourCandidature_CandidatureNonTrouvee() {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = new Employeur(email, "pass", "tel", "nom", "contact");

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );

        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Long candidatureId = 999L;
        when(candidatureRepository.findById(candidatureId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CandidatureNonTrouveeException.class, () -> employeurService.getLettreMotivationPourCandidature(candidatureId));
    }

    @Test
    public void testGetLettreMotivationPourCandidature_NonAutorise() {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Employeur autreEmployeur = mock(Employeur.class);
        when(autreEmployeur.getId()).thenReturn(2L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );

        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Etudiant etudiant = new Etudiant("etudiant@test.com", "pass", "tel",
                "Jean", "Dupont", Programme.P420_B0);

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(autreEmployeur);

        Candidature candidature = new Candidature(etudiant, offre, null);
        Long candidatureId = 1L;

        when(candidatureRepository.findById(candidatureId))
                .thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class, () -> employeurService.getLettreMotivationPourCandidature(candidatureId));
    }

    @Test
    public void testGetLettreMotivationPourCandidature_LettreNonExistante() {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );

        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Etudiant etudiant = new Etudiant("etudiant@test.com", "pass", "tel",
                "Jean", "Dupont", Programme.P420_B0);

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(employeur);

        Candidature candidature = new Candidature(etudiant, offre, null);
        Long candidatureId = 1L;

        when(candidatureRepository.findById(candidatureId))
                .thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(CVNonExistantException.class, () -> employeurService.getLettreMotivationPourCandidature(candidatureId));
    }

    @Test
    public void testCreerOffreDeStage_DateInvalide() {
        // Arrange
        AuthResponseDTO utilisateur = new AuthResponseDTO("Bearer validToken");
        when(jwtTokenProvider.isEmployeur(anyString(), any(JwtTokenProvider.class))).thenReturn(true);

        // Act & Assert - Date de fin avant date de début
        assertThrows(DateInvalideException.class, () -> employeurService.creerOffreDeStage(
                utilisateur,
                "titre",
                "desc",
                LocalDate.of(2024, 6, 1),
                LocalDate.of(2024, 1, 1),
                ProgrammeDTO.P410_A1,
                "lieu",
                "rem",
                LocalDate.of(2024, 5, 1),
                null, null, null, null, null,
                "dummyValue"
        ));
    }


    @Test
    public void testCreerConvocation_Succes() throws Exception {
        // Arrange - Mock Security Context
        int anneeTest = getAnneeAcademiqueCourante();
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        // Mock authorities to return EMPLOYEUR role
        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("EMPLOYEUR");
        when(authentication.getAuthorities()).thenReturn((Collection) Collections.singletonList(authority));
        when(authentication.getName()).thenReturn("employeur@test.com");

        // Mock employeur with reflection to set ID
        Employeur employeur = new Employeur();
        employeur.setEmail("employeur@test.com");
        // Use reflection to set the ID
        java.lang.reflect.Field idField = Employeur.class.getSuperclass().getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(employeur, 1L);

        when(employeurRepository.findByEmail("employeur@test.com")).thenReturn(employeur);

        // Mock candidature and offre with current year
        Offre offre = new Offre();
        offre.setEmployeur(employeur);
        offre.setDate_debut(LocalDate.of(anneeTest, 1, 1));
        offre.setAnnee(anneeTest);

        Candidature candidature = new Candidature();
        candidature.setOffre(offre);

        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        dto.candidatureId = 1L;
        dto.setDateHeure(LocalDateTime.now().plusDays(5));
        dto.setLieuOuLien("Salle 302");
        dto.setMessage("Test");

        when(candidatureRepository.findById(1L)).thenReturn(Optional.of(candidature));
        when(convocationEntrevueRepository.save(any(ConvocationEntrevue.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act & Assert
        assertDoesNotThrow(() -> employeurService.creerConvocation(dto));
    }

    @Test
    public void testCreerConvocation_CandidatureNonTrouvee() {
        // Arrange - Mock Security Context
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("EMPLOYEUR");
        when(authentication.getAuthorities()).thenReturn((Collection) Collections.singletonList(authority));
        when(authentication.getName()).thenReturn("employeur@test.com");

        Employeur employeur = new Employeur();
        employeur.setEmail("employeur@test.com");
        when(employeurRepository.findByEmail("employeur@test.com")).thenReturn(employeur);

        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        dto.candidatureId = 2L;

        when(candidatureRepository.findById(2L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CandidatureNonTrouveeException.class, () -> employeurService.creerConvocation(dto));
    }

    @Test
    public void testCreerConvocation_DejaExistante() throws Exception {
        // Arrange - Mock Security Context
        int anneeTest = getAnneeAcademiqueCourante();
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("EMPLOYEUR");
        when(authentication.getAuthorities()).thenReturn((Collection) Collections.singletonList(authority));
        when(authentication.getName()).thenReturn("employeur@test.com");

        Employeur employeur = new Employeur();
        employeur.setEmail("employeur@test.com");
        // Use reflection to set the ID
        java.lang.reflect.Field idField = Employeur.class.getSuperclass().getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(employeur, 1L);

        when(employeurRepository.findByEmail("employeur@test.com")).thenReturn(employeur);

        // Mock candidature with existing convocation
        Offre offre = new Offre();
        offre.setEmployeur(employeur);
        offre.setDate_debut(LocalDate.of(anneeTest, 1, 1));
        offre.setAnnee(anneeTest);

        Candidature candidature = new Candidature();
        candidature.setOffre(offre);
        ConvocationEntrevue convocation = new ConvocationEntrevue();
        candidature.setConvocationEntrevue(convocation);

        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        dto.candidatureId = 3L;
        dto.setDateHeure(LocalDateTime.now().plusDays(5));
        dto.setLieuOuLien("Salle 302");
        dto.setMessage("Test");

        when(candidatureRepository.findById(3L)).thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(ConvocationDejaExistanteException.class, () -> employeurService.creerConvocation(dto));
    }

    @Test
    public void testModifierConvocation_Succes() throws Exception {
        // Arrange - Mock Security Context
        int anneeTest = getAnneeAcademiqueCourante();
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("EMPLOYEUR");
        when(authentication.getAuthorities()).thenReturn((Collection) Collections.singletonList(authority));
        when(authentication.getName()).thenReturn("employeur@test.com");

        Employeur employeur = new Employeur();
        employeur.setEmail("employeur@test.com");
        // Use reflection to set the ID
        java.lang.reflect.Field idField = Employeur.class.getSuperclass().getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(employeur, 1L);

        when(employeurRepository.findByEmail("employeur@test.com")).thenReturn(employeur);

        // Mock candidature with current year offre
        Offre offre = new Offre();
        offre.setEmployeur(employeur);
        offre.setDate_debut(LocalDate.of(anneeTest, 1, 1));
        offre.setAnnee(anneeTest);

        Candidature candidature = new Candidature();
        candidature.setOffre(offre);
        ConvocationEntrevue convocation = new ConvocationEntrevue();
        candidature.setConvocationEntrevue(convocation);

        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        dto.candidatureId = 4L;
        dto.setDateHeure(LocalDateTime.now().plusDays(5));
        dto.setLieuOuLien("Salle 404");
        dto.setMessage("Modified");

        when(candidatureRepository.findById(4L)).thenReturn(Optional.of(candidature));
        when(convocationEntrevueRepository.save(any(ConvocationEntrevue.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act & Assert
        assertDoesNotThrow(() -> employeurService.modifierConvocation(dto));
    }

    @Test
    public void testModifierConvocation_CandidatureNonTrouvee() {
        // Arrange - Mock Security Context
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("EMPLOYEUR");
        when(authentication.getAuthorities()).thenReturn((Collection) Collections.singletonList(authority));
        when(authentication.getName()).thenReturn("employeur@test.com");

        Employeur employeur = new Employeur();
        employeur.setEmail("employeur@test.com");
        when(employeurRepository.findByEmail("employeur@test.com")).thenReturn(employeur);

        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        dto.candidatureId = 5L;

        when(candidatureRepository.findById(5L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CandidatureNonTrouveeException.class, () -> employeurService.modifierConvocation(dto));
    }

    @Test
    public void testAnnulerConvocation_Succes() throws Exception {
        // Arrange - Mock Security Context
        int anneeTest = getAnneeAcademiqueCourante();
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("EMPLOYEUR");
        when(authentication.getAuthorities()).thenReturn((Collection) Collections.singletonList(authority));
        when(authentication.getName()).thenReturn("employeur@test.com");

        Employeur employeur = new Employeur();
        employeur.setEmail("employeur@test.com");
        // Use reflection to set the ID
        java.lang.reflect.Field idField = Employeur.class.getSuperclass().getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(employeur, 1L);

        when(employeurRepository.findByEmail("employeur@test.com")).thenReturn(employeur);

        // Mock candidature with current year offre
        Offre offre = new Offre();
        offre.setEmployeur(employeur);
        offre.setDate_debut(LocalDate.of(anneeTest, 1, 1));
        offre.setAnnee(anneeTest);

        Candidature candidature = new Candidature();
        candidature.setOffre(offre);
        ConvocationEntrevue convocation = new ConvocationEntrevue();
        candidature.setConvocationEntrevue(convocation);

        when(candidatureRepository.findById(6L)).thenReturn(Optional.of(candidature));
        when(convocationEntrevueRepository.save(any(ConvocationEntrevue.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act & Assert
        assertDoesNotThrow(() -> employeurService.annulerConvocation(6L));
    }

    @Test
    public void testAnnulerConvocation_CandidatureNonTrouvee() {
        // Arrange - Mock Security Context
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("EMPLOYEUR");
        when(authentication.getAuthorities()).thenReturn((Collection) Collections.singletonList(authority));
        when(authentication.getName()).thenReturn("employeur@test.com");

        Employeur employeur = new Employeur();
        employeur.setEmail("employeur@test.com");
        when(employeurRepository.findByEmail("employeur@test.com")).thenReturn(employeur);

        when(candidatureRepository.findById(7L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CandidatureNonTrouveeException.class, () -> employeurService.annulerConvocation(7L));
    }

    @Test
    public void testGetConvocationsPourEmployeur_Succes() throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        // Arrange
        int anneeTest = getAnneeAcademiqueCourante();
        String email = "employeur@test.com";
        Employeur employeur = new Employeur(email, "pass1234A!", "tel", "nom", "contact");
        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Offre offre = mock(Offre.class);
        when(offre.getAnnee()).thenReturn(anneeTest);
        List<Offre> offres = List.of(offre);
        Candidature candidature = new Candidature();
        candidature.setOffre(offre);
        ConvocationEntrevue convocation = new ConvocationEntrevue();
        convocation.setCandidature(candidature);
        candidature.setConvocationEntrevue(convocation);
        List<Candidature> candidatures = List.of(candidature);
        when(offreRepository.findAllByEmployeur(employeur)).thenReturn(offres);
        when(candidatureRepository.findAllByOffreIn(offres)).thenReturn(candidatures);
        // Act
        List<ConvocationEntrevueDTO> result = employeurService.getConvocationsPourEmployeur(anneeTest);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    public void testApprouverCandidature_Succes() {
        // Arrange
        int anneeTest = getAnneeAcademiqueCourante();
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(employeur);
        when(offre.getAnnee()).thenReturn(anneeTest);

        Candidature candidature = new Candidature();
        candidature.setId(10L);
        candidature.setOffre(offre);
        candidature.setStatut(Candidature.StatutCandidature.EN_ATTENTE);

        when(candidatureRepository.findById(10L)).thenReturn(Optional.of(candidature));

        // Act & Assert
        assertDoesNotThrow(() -> employeurService.approuverCandidature(10L));
        verify(candidatureRepository, times(1)).save(candidature);
    }

    @Test
    public void testApprouverCandidature_CandidatureNonTrouvee() {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        when(candidatureRepository.findById(11L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CandidatureNonTrouveeException.class, () -> employeurService.approuverCandidature(11L));
    }

    @Test
    public void testApprouverCandidature_NonAutorise() {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Employeur autre = mock(Employeur.class);
        when(autre.getId()).thenReturn(2L);
        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(autre);

        Candidature candidature = new Candidature();
        candidature.setId(12L);
        candidature.setOffre(offre);
        candidature.setStatut(Candidature.StatutCandidature.EN_ATTENTE);

        when(candidatureRepository.findById(12L)).thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class, () -> employeurService.approuverCandidature(12L));
    }

    @Test
    public void testApprouverCandidature_DejaVerifie() {
        // Arrange
        int anneeTest = getAnneeAcademiqueCourante();
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(employeur);
        when(offre.getAnnee()).thenReturn(anneeTest);

        Candidature candidature = new Candidature();
        candidature.setId(13L);
        candidature.setOffre(offre);
        candidature.setStatut(Candidature.StatutCandidature.ACCEPTEE);

        when(candidatureRepository.findById(13L)).thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(CandidatureDejaVerifieException.class, () -> employeurService.approuverCandidature(13L));
    }

    @Test
    public void testRefuserCandidature_Succes() {
        // Arrange
        int anneeTest = getAnneeAcademiqueCourante();
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(employeur);
        when(offre.getAnnee()).thenReturn(anneeTest);

        Candidature candidature = new Candidature();
        candidature.setId(14L);
        candidature.setOffre(offre);
        candidature.setStatut(Candidature.StatutCandidature.EN_ATTENTE);

        when(candidatureRepository.findById(14L)).thenReturn(Optional.of(candidature));

        // Act & Assert
        assertDoesNotThrow(() -> employeurService.refuserCandidature(14L, "Pas assez d'expérience"));
        assertEquals("Pas assez d'expérience", candidature.getMessageReponse());
        verify(candidatureRepository, times(1)).save(candidature);
    }

    @Test
    public void testRefuserCandidature_CandidatureNonTrouvee() {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        when(candidatureRepository.findById(11L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CandidatureNonTrouveeException.class, () -> employeurService.refuserCandidature(11L,"Pas bon pour ce travail"));
    }

    @Test
    public void testRefuserCandidature_NonAutorise() {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Employeur autre = mock(Employeur.class);
        when(autre.getId()).thenReturn(2L);
        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(autre);

        Candidature candidature = new Candidature();
        candidature.setId(12L);
        candidature.setOffre(offre);
        candidature.setStatut(Candidature.StatutCandidature.EN_ATTENTE);

        when(candidatureRepository.findById(12L)).thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class, () -> employeurService.refuserCandidature(12L, "Pas bon pour ce travail"));
    }

    @Test
    public void testRefuserCandidature_DejaVerifie() {
        // Arrange
        int anneeTest = getAnneeAcademiqueCourante();
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(employeur);
        when(offre.getAnnee()).thenReturn(anneeTest);

        Candidature candidature = new Candidature();
        candidature.setId(15L);
        candidature.setOffre(offre);
        candidature.setStatut(Candidature.StatutCandidature.REFUSEE);

        when(candidatureRepository.findById(15L)).thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(CandidatureDejaVerifieException.class, () -> employeurService.refuserCandidature(15L, "Raison"));
    }

    @Test
    public void testGetNotificationsPourEmployeurConnecte_Succes() throws Exception {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = new Employeur(email, "pass", "tel", "nom", "contact");

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Notification notif1 = new Notification();
        notif1.setUtilisateur(employeur);
        notif1.setMessageKey("test.message1");
        notif1.setLu(false);

        Notification notif2 = new Notification();
        notif2.setUtilisateur(employeur);
        notif2.setMessageKey("test.message2");
        notif2.setLu(true);

        when(notificationRepository.findAllByUtilisateurAndLuFalseOrderByDateCreationDesc(employeur))
                .thenReturn(Arrays.asList(notif1, notif2));

        // Act
        var result = employeurService.getNotificationsPourEmployeurConnecte();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(notificationRepository, times(1)).findAllByUtilisateurAndLuFalseOrderByDateCreationDesc(employeur);
    }

    @Test
    public void testMarquerNotificationLu_Succes() throws Exception {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Notification notification = new Notification();
        notification.setUtilisateur(employeur);
        notification.setLu(false);

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

        // Act
        employeurService.marquerNotificationLu(1L, true);

        // Assert
        assertTrue(notification.isLu());
        verify(notificationRepository, times(1)).save(notification);
    }

    @Test
    public void testMarquerNotificationLu_NonAutorise() {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Employeur autreEmployeur = mock(Employeur.class);
        when(autreEmployeur.getId()).thenReturn(2L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Notification notification = new Notification();
        notification.setUtilisateur(autreEmployeur);

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class, () -> employeurService.marquerNotificationLu(1L, true));
    }

    @Test
    public void testGetOffresApprouvees_Succes() throws Exception {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = new Employeur(email, "pass", "tel", "nom", "contact");

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Offre offre1 = new Offre("Titre 1", "Desc 1", LocalDate.now(), LocalDate.now().plusMonths(3),
                Programme.P420_B0, "lieu", "rem", LocalDate.now().plusDays(10), employeur);
        offre1.setStatutApprouve(Offre.StatutApprouve.APPROUVE);

        Offre offre2 = new Offre("Titre 2", "Desc 2", LocalDate.now(), LocalDate.now().plusMonths(3),
                Programme.P420_B0, "lieu", "rem", LocalDate.now().plusDays(10), employeur);
        offre2.setStatutApprouve(Offre.StatutApprouve.ATTENTE);

        when(offreRepository.findOffreByEmployeurId(employeur.getId()))
                .thenReturn(Arrays.asList(offre1, offre2));

        // Act
        var result = employeurService.getOffresApprouvees();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    public void testGetEntentesPourEmployeur_Succes() throws Exception {
        // Arrange
        int anneeTest = getAnneeAcademiqueCourante();
        String email = "employeur@test.com";
        Employeur employeur = new Employeur(email, "pass", "tel", "nom", "contact");

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Offre offre = new Offre("Titre", "Desc", LocalDate.of(anneeTest, 1, 1), LocalDate.of(anneeTest, 6, 1),
                Programme.P420_B0, "lieu", "rem", LocalDate.of(anneeTest, 5, 1), employeur);

        EntenteStage entente1 = new EntenteStage();
        entente1.setEmployeur(employeur);
        entente1.setTitre("Entente 1");
        entente1.setOffre(offre);
        Etudiant etu1 = new Etudiant("etu1@test.com", "pass", "tel", "Jean", "Dupont", Programme.P420_B0);
        entente1.setEtudiant(etu1);

        EntenteStage entente2 = new EntenteStage();
        entente2.setEmployeur(employeur);
        entente2.setTitre("Entente 2");
        entente2.setOffre(offre);
        Etudiant etu2 = new Etudiant("etu2@test.com", "pass", "tel", "Marie", "Curie", Programme.P420_B0);
        entente2.setEtudiant(etu2);

        when(ententeStageRepository.findByEmployeurAndArchivedFalse(employeur))
                .thenReturn(Arrays.asList(entente1, entente2));

        // Act
        var result = employeurService.getEntentesPourEmployeur(anneeTest);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(ententeStageRepository, times(1)).findByEmployeurAndArchivedFalse(employeur);
    }

    @Test
    public void testGetEntentesEnAttente_Succes() throws Exception {
        // Arrange
        int anneeTest = getAnneeAcademiqueCourante();
        String email = "employeur@test.com";
        Employeur employeur = new Employeur(email, "pass", "tel", "nom", "contact");

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Offre offre = new Offre("Titre", "Desc", LocalDate.of(anneeTest, 1, 1), LocalDate.of(anneeTest, 6, 1),
                Programme.P420_B0, "lieu", "rem", LocalDate.of(anneeTest, 5, 1), employeur);

        EntenteStage entente1 = new EntenteStage();
        entente1.setEmployeur(employeur);
        entente1.setEmployeurSignature(EntenteStage.SignatureStatus.EN_ATTENTE);
        entente1.setOffre(offre);

        Etudiant etu1 = new Etudiant("etu1@test.com", "pass", "tel", "Jean", "Dupont", Programme.P420_B0);
        entente1.setEtudiant(etu1);

        when(ententeStageRepository.findByEmployeurAndEmployeurSignatureAndArchivedFalse(
                employeur, EntenteStage.SignatureStatus.EN_ATTENTE))
                .thenReturn(Collections.singletonList(entente1));

        // Act
        var result = employeurService.getEntentesEnAttente(anneeTest);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    public void testGetEntenteSpecifique_Succes() throws Exception {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        EntenteStage entente = new EntenteStage();
        entente.setEmployeur(employeur);
        entente.setTitre("Test Entente");
        Etudiant etu1 = new Etudiant("etu1@test.com", "pass", "tel", "Jean", "Dupont", Programme.P420_B0);
        entente.setEtudiant(etu1);

        when(ententeStageRepository.findById(1L)).thenReturn(Optional.of(entente));

        // Act
        var result = employeurService.getEntenteSpecifique(1L);

        // Assert
        assertNotNull(result);
        verify(ententeStageRepository, times(1)).findById(1L);
    }

    @Test
    public void testGetEntenteSpecifique_NonAutorise() {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Employeur autreEmployeur = mock(Employeur.class);
        when(autreEmployeur.getId()).thenReturn(2L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        EntenteStage entente = new EntenteStage();
        entente.setEmployeur(autreEmployeur);

        when(ententeStageRepository.findById(1L)).thenReturn(Optional.of(entente));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class, () -> employeurService.getEntenteSpecifique(1L));
    }

    @Test
    public void testSignerEntente_Succes() throws Exception {
        // Arrange
        int anneeTest = getAnneeAcademiqueCourante();
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Etudiant etudiant = new Etudiant("etudiant@test.com", "pass", "tel",
                "Jean", "Dupont", Programme.P420_B0);

        Offre offre = new Offre("Titre", "Desc", LocalDate.of(anneeTest, 1, 1), LocalDate.of(anneeTest, 6, 1),
                Programme.P420_B0, "lieu", "rem", LocalDate.of(anneeTest, 5, 1), employeur);

        EntenteStage entente = new EntenteStage();
        entente.setEmployeur(employeur);
        entente.setEtudiant(etudiant);
        entente.setTitre("Entente Test");
        entente.setOffre(offre);
        entente.setEmployeurSignature(EntenteStage.SignatureStatus.EN_ATTENTE);
        entente.setEtudiantSignature(EntenteStage.SignatureStatus.EN_ATTENTE);

        when(ententeStageRepository.findById(1L)).thenReturn(Optional.of(entente));
        when(ententeStageRepository.save(any(EntenteStage.class))).thenReturn(entente);

        // Act
        employeurService.signerEntente(1L);

        // Assert
        assertEquals(EntenteStage.SignatureStatus.SIGNEE, entente.getEmployeurSignature());
        verify(ententeStageRepository, times(1)).save(entente);
    }

    @Test
    public void testSignerEntente_NonAutorise() {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Employeur autreEmployeur = mock(Employeur.class);
        when(autreEmployeur.getId()).thenReturn(2L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        EntenteStage entente = new EntenteStage();
        entente.setEmployeur(autreEmployeur);

        when(ententeStageRepository.findById(1L)).thenReturn(Optional.of(entente));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class, () -> employeurService.signerEntente(1L));
    }

    @Test
    public void testRefuserEntente_Succes() throws Exception {
        // Arrange
        int anneeTest = getAnneeAcademiqueCourante();
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Etudiant etudiant = new Etudiant("etudiant@test.com", "pass", "tel",
                "Jean", "Dupont", Programme.P420_B0);

        Offre offre = new Offre("Titre", "Desc", LocalDate.of(anneeTest, 1, 1), LocalDate.of(anneeTest, 6, 1),
                Programme.P420_B0, "lieu", "rem", LocalDate.of(anneeTest, 5, 1), employeur);

        EntenteStage entente = new EntenteStage();
        entente.setEmployeur(employeur);
        entente.setEtudiant(etudiant);
        entente.setTitre("Entente Test");
        entente.setOffre(offre);
        entente.setEmployeurSignature(EntenteStage.SignatureStatus.EN_ATTENTE);

        when(ententeStageRepository.findById(1L)).thenReturn(Optional.of(entente));
        when(ententeStageRepository.save(any(EntenteStage.class))).thenReturn(entente);

        // Act
        employeurService.refuserEntente(1L);

        // Assert
        assertEquals(EntenteStage.SignatureStatus.REFUSEE, entente.getEmployeurSignature());
        assertEquals(EntenteStage.StatutEntente.ANNULEE, entente.getStatut());
        verify(ententeStageRepository, times(1)).save(entente);
    }

    @Test
    public void testRefuserEntente_NonAutorise() {
        // Arrange
        String email = "employeur@test.com";
        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);

        Employeur autreEmployeur = mock(Employeur.class);
        when(autreEmployeur.getId()).thenReturn(2L);

        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("EMPLOYEUR")
        );
        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        EntenteStage entente = new EntenteStage();
        entente.setEmployeur(autreEmployeur);

        when(ententeStageRepository.findById(1L)).thenReturn(Optional.of(entente));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class, () -> employeurService.refuserEntente(1L));
    }

    @Test
    public void testCreerEvaluation_Succes() throws Exception {
        // Arrange
        int anneeTest = getAnneeAcademiqueCourante();
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("EMPLOYEUR");
        when(authentication.getAuthorities()).thenReturn((Collection) Collections.singletonList(authority));
        when(authentication.getName()).thenReturn("employeur@test.com");

        Employeur employeur = mock(Employeur.class);
        when(employeur.getNomEntreprise()).thenReturn("Entreprise X");
        when(employeurRepository.findByEmail("employeur@test.com")).thenReturn(employeur);

        // Entente et étudiant
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getPrenom()).thenReturn("Jean");
        when(etudiant.getNom()).thenReturn("Dupont");

        Offre offre = mock(Offre.class);
        when(offre.getAnnee()).thenReturn(anneeTest);

        EntenteStage entente = mock(EntenteStage.class);
        when(entente.getEtudiant()).thenReturn(etudiant);
        when(entente.getStatut()).thenReturn(EntenteStage.StatutEntente.SIGNEE);
        when(entente.getId()).thenReturn(100L);
        when(entente.getOffre()).thenReturn(offre);

        when(ententeStageRepository.findById(100L)).thenReturn(Optional.of(entente));
        when(evaluationRepository.existsByEntenteId(anyLong())).thenReturn(false);
        when(pdfGenerationEvaluation.genererEtRemplirEvaluationPdf(
                any(CreerEvaluationDTO.class),
                anyString(),
                any(),
                anyString()
        )).thenReturn(Base64.getEncoder().encodeToString("pdfcontent".getBytes(StandardCharsets.UTF_8)));
        when(evaluationRepository.save(any(EvaluationEtudiantParEmployeur.class))).thenAnswer(inv -> inv.getArgument(0));

        CreerEvaluationDTO dto = new CreerEvaluationDTO();
        dto.setEntenteId(100L);
        dto.setEtudiantId(2L);
        dto.setNomSuperviseur("Jean Dupont");
        dto.setDateSignature(LocalDate.of(2025, 11, 1));

        // Act & Assert
        assertDoesNotThrow(() -> employeurService.creerEvaluation(dto));
        verify(evaluationRepository, times(1)).save(any(EvaluationEtudiantParEmployeur.class));
    }

    @Test
    public void testCreerEvaluation_EntenteNonTrouvee() {
        // Arrange
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("EMPLOYEUR");
        when(authentication.getAuthorities()).thenReturn((Collection) Collections.singletonList(authority));
        when(authentication.getName()).thenReturn("employeur@test.com");

        Employeur employeur = mock(Employeur.class);
        when(employeurRepository.findByEmail("employeur@test.com")).thenReturn(employeur);

        when(ententeStageRepository.findById(999L)).thenReturn(Optional.empty());

        CreerEvaluationDTO dto = new CreerEvaluationDTO();
        dto.setEntenteId(999L);

        assertThrows(EntenteNonTrouveException.class, () -> employeurService.creerEvaluation(dto));
    }

    @Test
    public void testCreerEvaluation_EntenteNonSignee() {
        // Arrange - mock security context and employeur
        int anneeTest = getAnneeAcademiqueCourante();
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("EMPLOYEUR");
        when(authentication.getAuthorities()).thenReturn((Collection) Collections.singletonList(authority));
        when(authentication.getName()).thenReturn("employeur@test.com");

        Employeur employeur = mock(Employeur.class);
        when(employeurRepository.findByEmail("employeur@test.com")).thenReturn(employeur);

        // Mock the Offre with current year - ADD THESE LINES
        Offre offre = mock(Offre.class);
        when(offre.getAnnee()).thenReturn(anneeTest);

        // Entente non signée
        EntenteStage entente = mock(EntenteStage.class);
        when(entente.getStatut()).thenReturn(EntenteStage.StatutEntente.EN_ATTENTE);
        when(entente.getOffre()).thenReturn(offre);

        when(ententeStageRepository.findById(200L)).thenReturn(Optional.of(entente));

        CreerEvaluationDTO dto = new CreerEvaluationDTO();
        dto.setEntenteId(200L);
        dto.setEtudiantId(2L);
        dto.setNomSuperviseur("Jean Dupont");

        // Act & Assert
        assertThrows(EntenteNonFinaliseeException.class, () -> employeurService.creerEvaluation(dto));
    }

    @Test
    public void testGetEvaluationsPourEmployeur_Succes() throws Exception {
        // Arrange
        int anneeTest = getAnneeAcademiqueCourante();
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("EMPLOYEUR");
        when(authentication.getAuthorities()).thenReturn((Collection) Collections.singletonList(authority));
        when(authentication.getName()).thenReturn("employeur@test.com");

        Employeur employeur = mock(Employeur.class);
        employeur.setEmail("employeur@test.com");
        when(employeur.getId()).thenReturn(1L);
        when(employeurRepository.findByEmail("employeur@test.com")).thenReturn(employeur);

        Offre offre = mock(Offre.class);
        when(offre.getAnnee()).thenReturn(anneeTest);

        EntenteStage entente = mock(EntenteStage.class);
        when(entente.getOffre()).thenReturn(offre);

        EvaluationEtudiantParEmployeur eval1 = new EvaluationEtudiantParEmployeur();
        eval1.setEntente(entente);
        EvaluationEtudiantParEmployeur eval2 = new EvaluationEtudiantParEmployeur();
        eval2.setEntente(entente);

        doReturn(List.of(eval1, eval2)).when(evaluationRepository).findAllByEmployeurId(anyLong());

        // Act
        List<EvaluationDTO> result = employeurService.getEvaluationsPourEmployeur(anneeTest);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
    }

    @Test
    public void testGetEvaluationPdf_Succes() throws Exception {
        // Arrange - security context and employeur
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("EMPLOYEUR");
        when(authentication.getAuthorities()).thenReturn((Collection) Collections.singletonList(authority));
        when(authentication.getName()).thenReturn("employeur@test.com");

        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);
        when(employeurRepository.findByEmail("employeur@test.com")).thenReturn(employeur);

        EvaluationEtudiantParEmployeur evaluation = new EvaluationEtudiantParEmployeur();
        // set employer id on evaluation.employeur
        Employeur evalEmployeur = mock(Employeur.class);
        when(evalEmployeur.getId()).thenReturn(1L);
        evaluation.setEmployeur(evalEmployeur);
        evaluation.setPdfBase64(Base64.getEncoder().encodeToString("pdfcontent".getBytes(StandardCharsets.UTF_8)));

        when(evaluationRepository.findById(50L)).thenReturn(Optional.of(evaluation));

        // Act
        byte[] pdf = employeurService.getEvaluationPdf(50L);

        // Assert
        assertNotNull(pdf);
        assertArrayEquals("pdfcontent".getBytes(StandardCharsets.UTF_8), pdf);
    }

    @Test
    public void testGetEvaluationPdf_NonAutorise() {
        // Arrange
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("EMPLOYEUR");
        when(authentication.getAuthorities()).thenReturn((Collection) Collections.singletonList(authority));
        when(authentication.getName()).thenReturn("employeur@test.com");

        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);
        when(employeurRepository.findByEmail("employeur@test.com")).thenReturn(employeur);

        EvaluationEtudiantParEmployeur evaluation = new EvaluationEtudiantParEmployeur();
        Employeur autre = mock(Employeur.class);
        when(autre.getId()).thenReturn(2L);
        evaluation.setEmployeur(autre);
        evaluation.setPdfBase64(Base64.getEncoder().encodeToString("pdfcontent".getBytes(StandardCharsets.UTF_8)));

        when(evaluationRepository.findById(51L)).thenReturn(Optional.of(evaluation));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class, () -> employeurService.getEvaluationPdf(51L));
    }

    @Test
    public void testGetEvaluationPdf_PdfManquant() {
        // Arrange
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("EMPLOYEUR");
        when(authentication.getAuthorities()).thenReturn((Collection) Collections.singletonList(authority));
        when(authentication.getName()).thenReturn("employeur@test.com");

        Employeur employeur = mock(Employeur.class);
        when(employeur.getId()).thenReturn(1L);
        when(employeurRepository.findByEmail("employeur@test.com")).thenReturn(employeur);

        EvaluationEtudiantParEmployeur evaluation = new EvaluationEtudiantParEmployeur();
        Employeur evalEmployeur = mock(Employeur.class);
        when(evalEmployeur.getId()).thenReturn(1L);
        evaluation.setEmployeur(evalEmployeur);
        evaluation.setPdfBase64(null);

        when(evaluationRepository.findById(52L)).thenReturn(Optional.of(evaluation));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> employeurService.getEvaluationPdf(52L));
    }

    @Test
    public void testGetAnneeAcademiqueCourante() throws Exception {
        // Test the private method using reflection
        java.lang.reflect.Method method = EmployeurService.class.getDeclaredMethod("getAnneeAcademiqueCourante");
        method.setAccessible(true);

        int result = (int) method.invoke(employeurService);

        LocalDate now = LocalDate.now();
        int expectedYear = now.getMonthValue() >= 8 ? now.getYear() + 1 : now.getYear();

        assertEquals(expectedYear, result);
    }

    @Test
    public void testVerifierOffreAnneeCourante_OffreNull() throws Exception {
        // Arrange
        java.lang.reflect.Method method = EmployeurService.class.getDeclaredMethod("verifierOffreAnneeCourante", Offre.class);
        method.setAccessible(true);

        // Act & Assert
        assertThrows(java.lang.reflect.InvocationTargetException.class, () -> {
            method.invoke(employeurService, (Offre) null);
        });
    }

    @Test
    public void testVerifierOffreAnneeCourante_AnneeDifferente() throws Exception {
        // Arrange
        LocalDate now = LocalDate.now();
        int anneeActuelle = now.getMonthValue() >= 8 ? now.getYear() + 1 : now.getYear();

        Offre offre = new Offre();
        offre.setAnnee(anneeActuelle - 1); // Previous year

        java.lang.reflect.Method method = EmployeurService.class.getDeclaredMethod("verifierOffreAnneeCourante", Offre.class);
        method.setAccessible(true);

        // Act & Assert
        assertThrows(java.lang.reflect.InvocationTargetException.class, () -> {
            method.invoke(employeurService, offre);
        });
    }

    @Test
    public void testVerifierOffreAnneeCourante_AnneeCourante() throws Exception {
        // Arrange
        LocalDate now = LocalDate.now();
        int anneeActuelle = now.getMonthValue() >= 8 ? now.getYear() + 1 : now.getYear();

        Offre offre = new Offre();
        offre.setAnnee(anneeActuelle);

        java.lang.reflect.Method method = EmployeurService.class.getDeclaredMethod("verifierOffreAnneeCourante", Offre.class);
        method.setAccessible(true);

        // Act & Assert - Should not throw
        assertDoesNotThrow(() -> method.invoke(employeurService, offre));
    }

}