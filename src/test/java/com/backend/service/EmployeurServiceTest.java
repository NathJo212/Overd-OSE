package com.backend.service;

import com.backend.Exceptions.*;
import com.backend.config.JwtTokenProvider;
import com.backend.modele.*;
import com.backend.persistence.*;
import com.backend.service.DTO.*;
import com.backend.util.EncryptageCV;
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
    private org.springframework.context.MessageSource messageSource;

    @Mock
    private EvaluationRepository evaluationRepository;

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
        when(jwtTokenProvider.isEmployeur(anyString(), any())).thenReturn(true);
        when(jwtTokenProvider.getEmailFromJWT(anyString())).thenReturn("mon@employeur.com");
        Employeur employeur = new Employeur("mon@employeur.com", "pass", "tel", "nom", "contact");
        when(employeurRepository.findByEmail(anyString())).thenReturn(employeur);

        employeurService.creerOffreDeStage(utilisateur, "titre", "desc",
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 6, 1),
                ProgrammeDTO.P410_A1, "lieu", "rem", LocalDate.of(2024, 5, 1), null, null, null, null);

        verify(offreRepository, times(1)).save(any(Offre.class));
    }

    @Test
    public void testCreerOffreDeStage_NonEmployeur() {
        AuthResponseDTO utilisateur = new AuthResponseDTO("Bearer fakeToken");
        when(jwtTokenProvider.isEmployeur(anyString(), any())).thenReturn(false);

        assertThrows(ActionNonAutoriseeException.class, () -> {
            employeurService.creerOffreDeStage(utilisateur, "titre", "desc",
                    LocalDate.of(2024, 1, 1), LocalDate.of(2024, 6, 1),
                    ProgrammeDTO.P500_AF, "lieu", "rem", LocalDate.of(2024, 5, 1), null, null, null, null);
        });
    }

    @Test
    public void testOffrePourEmployeur() throws Exception {
        // Arrange
        AuthResponseDTO utilisateur = new AuthResponseDTO("Bearer validToken");
        when(jwtTokenProvider.isEmployeur(anyString(), any())).thenReturn(true);
        when(jwtTokenProvider.getEmailFromJWT(anyString())).thenReturn("employeur@test.com");

        Employeur employeur = new Employeur("employeur@test.com", "pass", "tel", "nom", "contact");
        when(employeurRepository.findByEmail("employeur@test.com")).thenReturn(employeur);

        Offre offre1 = new Offre("Titre 1", "Description 1", LocalDate.of(2024, 1, 1), LocalDate.of(2024, 6, 1), Programme.P420_B0, "lieu", "rem", LocalDate.of(2024, 5, 1), employeur);
        Offre offre2 = new Offre("Titre 2", "Description 2", LocalDate.of(2024, 2, 1), LocalDate.of(2024, 7, 1), Programme.P420_B0, "lieu", "rem", LocalDate.of(2024, 6, 1), employeur);
        when(offreRepository.findOffreByEmployeurId(employeur.getId())).thenReturn(java.util.List.of(offre1, offre2));

        // Act
        var result = employeurService.OffrePourEmployeur(utilisateur);

        // Assert
        verify(jwtTokenProvider, times(1)).isEmployeur(anyString(), any());
        verify(employeurRepository, times(1)).findByEmail("employeur@test.com");
        verify(offreRepository, times(1)).findOffreByEmployeurId(employeur.getId());
        assertEquals(2, result.size());
    }

    @Test
    public void testOffrePourEmployeur_NonEmployeur() {
        // Arrange
        AuthResponseDTO utilisateur = new AuthResponseDTO("Bearer fakeToken");
        when(jwtTokenProvider.isEmployeur(anyString(), any())).thenReturn(false);

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class, () -> {
            employeurService.OffrePourEmployeur(utilisateur);
        });
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
        assertThrows(ActionNonAutoriseeException.class, () -> {
            employeurService.getEmployeurConnecte();
        });
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
        assertThrows(UtilisateurPasTrouveException.class, () -> {
            employeurService.getEmployeurConnecte();
        });
    }

    @Test
    public void testGetCandidaturesPourEmployeur_Succes() throws Exception {
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

        Etudiant etudiant = new Etudiant("etudiant@test.com", "pass", "tel",
                "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");

        Offre offre1 = new Offre("Titre 1", "Description 1",
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 6, 1),
                Programme.P420_B0, "lieu", "rem", LocalDate.of(2024, 5, 1), employeur);

        Offre offre2 = new Offre("Titre 2", "Description 2",
                LocalDate.of(2024, 2, 1), LocalDate.of(2024, 7, 1),
                Programme.P420_B0, "lieu", "rem", LocalDate.of(2024, 6, 1), employeur);

        Candidature candidature1 = new Candidature(etudiant, offre1, null);
        Candidature candidature2 = new Candidature(etudiant, offre2, null);

        offre1.getCandidatures().add(candidature1);
        offre2.getCandidatures().add(candidature2);

        when(offreRepository.findOffreByEmployeurId(employeur.getId()))
                .thenReturn(Arrays.asList(offre1, offre2));

        // Act
        List<CandidatureDTO> result = employeurService.getCandidaturesPourEmployeur();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(offreRepository, times(1)).findOffreByEmployeurId(employeur.getId());
    }

    @Test
    public void testGetCandidaturesPourEmployeur_AucuneCandidature() throws Exception {
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

        Offre offre = new Offre("Titre", "Description",
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 6, 1),
                Programme.P420_B0, "lieu", "rem", LocalDate.of(2024, 5, 1), employeur);

        when(offreRepository.findOffreByEmployeurId(employeur.getId()))
                .thenReturn(Collections.singletonList(offre));

        // Act
        List<CandidatureDTO> result = employeurService.getCandidaturesPourEmployeur();

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
                "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");

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
    public void testGetCandidatureSpecifique_CandidatureNonTrouvee() throws Exception {
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
        assertThrows(CandidatureNonTrouveeException.class, () -> {
            employeurService.getCandidatureSpecifique(candidatureId);
        });
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
                "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");

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
    public void testGetCvPourCandidature_CandidatureNonTrouvee() throws Exception {
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
        assertThrows(CandidatureNonTrouveeException.class, () -> {
            employeurService.getCvPourCandidature(candidatureId);
        });
    }

    @Test
    public void testGetCvPourCandidature_NonAutorise() throws Exception {
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
                "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");
        etudiant.setCv("cvChiffre".getBytes());

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(autreEmployeur);

        Candidature candidature = new Candidature(etudiant, offre, null);
        Long candidatureId = 1L;

        when(candidatureRepository.findById(candidatureId))
                .thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class, () -> {
            employeurService.getCvPourCandidature(candidatureId);
        });
    }

    @Test
    public void testGetCvPourCandidature_CvNonExistant() throws Exception {
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
                "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");
        // Pas de CV

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(employeur);

        Candidature candidature = new Candidature(etudiant, offre, null);
        Long candidatureId = 1L;

        when(candidatureRepository.findById(candidatureId))
                .thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(CVNonExistantException.class, () -> {
            employeurService.getCvPourCandidature(candidatureId);
        });
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
                "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");

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
    public void testGetLettreMotivationPourCandidature_CandidatureNonTrouvee() throws Exception {
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
        assertThrows(CandidatureNonTrouveeException.class, () -> {
            employeurService.getLettreMotivationPourCandidature(candidatureId);
        });
    }

    @Test
    public void testGetLettreMotivationPourCandidature_NonAutorise() throws Exception {
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
                "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(autreEmployeur);

        Candidature candidature = new Candidature(etudiant, offre, null);
        Long candidatureId = 1L;

        when(candidatureRepository.findById(candidatureId))
                .thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class, () -> {
            employeurService.getLettreMotivationPourCandidature(candidatureId);
        });
    }

    @Test
    public void testGetLettreMotivationPourCandidature_LettreNonExistante() throws Exception {
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
                "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(employeur);

        Candidature candidature = new Candidature(etudiant, offre, null);
        Long candidatureId = 1L;

        when(candidatureRepository.findById(candidatureId))
                .thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(CVNonExistantException.class, () -> {
            employeurService.getLettreMotivationPourCandidature(candidatureId);
        });
    }

    @Test
    public void testCreerOffreDeStage_DateInvalide() {
        // Arrange
        AuthResponseDTO utilisateur = new AuthResponseDTO("Bearer validToken");
        when(jwtTokenProvider.isEmployeur(anyString(), any())).thenReturn(true);

        // Act & Assert - Date de fin avant date de début
        assertThrows(DateInvalideException.class, () -> {
            employeurService.creerOffreDeStage(utilisateur, "titre", "desc",
                    LocalDate.of(2024, 6, 1), LocalDate.of(2024, 1, 1),
                    ProgrammeDTO.P410_A1, "lieu", "rem", LocalDate.of(2024, 5, 1), null, null, null, null);
        });
    }
    @Test
    public void testCreerConvocation_Succes() throws Exception {
        // Arrange - Mock Security Context
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

        // Mock candidature and offre
        Offre offre = new Offre();
        offre.setEmployeur(employeur);

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

        // Mock candidature
        Offre offre = new Offre();
        offre.setEmployeur(employeur);

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

        // Mock candidature
        Offre offre = new Offre();
        offre.setEmployeur(employeur);

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
        List<ConvocationEntrevueDTO> result = employeurService.getConvocationsPourEmployeur();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    public void testApprouverCandidature_Succes() throws Exception {
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

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(employeur);

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
    public void testApprouverCandidature_CandidatureNonTrouvee() throws Exception {
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
    public void testApprouverCandidature_NonAutorise() throws Exception {
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
    public void testApprouverCandidature_DejaVerifie() throws Exception {
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

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(employeur);

        Candidature candidature = new Candidature();
        candidature.setId(13L);
        candidature.setOffre(offre);
        candidature.setStatut(Candidature.StatutCandidature.ACCEPTEE);

        when(candidatureRepository.findById(13L)).thenReturn(Optional.of(candidature));

        // Act & Assert
        assertThrows(CandidatureDejaVerifieException.class, () -> employeurService.approuverCandidature(13L));
    }

    @Test
    public void testRefuserCandidature_Succes() throws Exception {
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

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(employeur);

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
    public void testRefuserCandidature_CandidatureNonTrouvee() throws Exception {
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
    public void testRefuserCandidature_NonAutorise() throws Exception {
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
    public void testRefuserCandidature_DejaVerifie() throws Exception {
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

        Offre offre = mock(Offre.class);
        when(offre.getEmployeur()).thenReturn(employeur);

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

        when(notificationRepository.findAllByUtilisateurOrderByDateCreationDesc(employeur))
                .thenReturn(Arrays.asList(notif1, notif2));

        // Act
        var result = employeurService.getNotificationsPourEmployeurConnecte();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(notificationRepository, times(1)).findAllByUtilisateurOrderByDateCreationDesc(employeur);
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
    public void testMarquerNotificationLu_NonAutorise() throws Exception {
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
        assertThrows(ActionNonAutoriseeException.class, () -> {
            employeurService.marquerNotificationLu(1L, true);
        });
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

        EntenteStage entente1 = new EntenteStage();
        entente1.setEmployeur(employeur);
        entente1.setTitre("Entente 1");
        Etudiant etu1 = new Etudiant("etu1@test.com", "pass", "tel", "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");
        entente1.setEtudiant(etu1);

        EntenteStage entente2 = new EntenteStage();
        entente2.setEmployeur(employeur);
        entente2.setTitre("Entente 2");
        Etudiant etu2 = new Etudiant("etu2@test.com", "pass", "tel", "Marie", "Curie", Programme.P420_B0, "Automne", "2024");
        entente2.setEtudiant(etu2);

        when(ententeStageRepository.findByEmployeurAndArchivedFalse(employeur))
                .thenReturn(Arrays.asList(entente1, entente2));

        // Act
        var result = employeurService.getEntentesPourEmployeur();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(ententeStageRepository, times(1)).findByEmployeurAndArchivedFalse(employeur);
    }

    @Test
    public void testGetEntentesEnAttente_Succes() throws Exception {
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

        EntenteStage entente1 = new EntenteStage();
        entente1.setEmployeur(employeur);
        entente1.setEmployeurSignature(EntenteStage.SignatureStatus.EN_ATTENTE);

        Etudiant etu1 = new Etudiant("etu1@test.com", "pass", "tel", "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");
        entente1.setEtudiant(etu1);

        when(ententeStageRepository.findByEmployeurAndEmployeurSignatureAndArchivedFalse(
                employeur, EntenteStage.SignatureStatus.EN_ATTENTE))
                .thenReturn(Collections.singletonList(entente1));

        // Act
        var result = employeurService.getEntentesEnAttente();

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
        Etudiant etu1 = new Etudiant("etu1@test.com", "pass", "tel", "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");
        entente.setEtudiant(etu1);

        when(ententeStageRepository.findById(1L)).thenReturn(Optional.of(entente));

        // Act
        var result = employeurService.getEntenteSpecifique(1L);

        // Assert
        assertNotNull(result);
        verify(ententeStageRepository, times(1)).findById(1L);
    }

    @Test
    public void testGetEntenteSpecifique_NonAutorise() throws Exception {
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
        assertThrows(ActionNonAutoriseeException.class, () -> {
            employeurService.getEntenteSpecifique(1L);
        });
    }

    @Test
    public void testSignerEntente_Succes() throws Exception {
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
                "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");

        EntenteStage entente = new EntenteStage();
        entente.setEmployeur(employeur);
        entente.setEtudiant(etudiant);
        entente.setTitre("Entente Test");
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
    public void testSignerEntente_NonAutorise() throws Exception {
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
        assertThrows(ActionNonAutoriseeException.class, () -> {
            employeurService.signerEntente(1L);
        });
    }

    @Test
    public void testRefuserEntente_Succes() throws Exception {
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
                "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");

        EntenteStage entente = new EntenteStage();
        entente.setEmployeur(employeur);
        entente.setEtudiant(etudiant);
        entente.setTitre("Entente Test");
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
    public void testRefuserEntente_NonAutorise() throws Exception {
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
        assertThrows(ActionNonAutoriseeException.class, () -> {
            employeurService.refuserEntente(1L);
        });
    }

    @Test
    public void testCreerEvaluation_Succes() throws Exception {
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

        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(5L);

        EntenteStage entente = new EntenteStage();
        entente.setEmployeur(employeur);
        entente.setEtudiant(etudiant);
        entente.setTitre("Entente Test");
        entente.setStatut(EntenteStage.StatutEntente.SIGNEE);

        when(ententeStageRepository.findById(100L)).thenReturn(Optional.of(entente));
        when(evaluationRepository.existsByEtudiantIdAndEmployeurId(5L, 1L)).thenReturn(false);
        when(evaluationRepository.save(any(Evaluation.class))).thenAnswer(inv -> inv.getArgument(0));

        EvaluationDTO dto = new EvaluationDTO();
        dto.setEntenteId(100L);
        dto.setCompetencesTechniques("Bon");
        dto.setRespectDelais("Oui");
        dto.setAttitudeIntegration("Très bien");
        dto.setCommentaires("Commentaire");

        // Act & Assert
        assertDoesNotThrow(() -> employeurService.creerEvaluation(dto));
        verify(evaluationRepository, times(1)).save(any(Evaluation.class));
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    public void testCreerEvaluation_EntenteNonTrouvee() throws Exception {
        // Arrange security context
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

        when(ententeStageRepository.findById(200L)).thenReturn(Optional.empty());

        EvaluationDTO dto = new EvaluationDTO();
        dto.setEntenteId(200L);

        // Act & Assert
        assertThrows(EntenteNonTrouveException.class, () -> employeurService.creerEvaluation(dto));
    }

    @Test
    public void testCreerEvaluation_EvaluationDejaExistante() throws Exception {
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

        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getId()).thenReturn(6L);

        EntenteStage entente = new EntenteStage();
        entente.setEmployeur(employeur);
        entente.setEtudiant(etudiant);
        entente.setStatut(EntenteStage.StatutEntente.SIGNEE);

        when(ententeStageRepository.findById(300L)).thenReturn(Optional.of(entente));
        when(evaluationRepository.existsByEtudiantIdAndEmployeurId(6L, 1L)).thenReturn(true);

        EvaluationDTO dto = new EvaluationDTO();
        dto.setEntenteId(300L);

        // Act & Assert
        assertThrows(EvaluationDejaExistanteException.class, () -> employeurService.creerEvaluation(dto));
    }

    @Test
    public void testCreerEvaluation_NonAutorise() throws Exception {
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

        Employeur autre = mock(Employeur.class);
        when(autre.getId()).thenReturn(2L);

        Etudiant etudiant = mock(Etudiant.class);

        EntenteStage entente = new EntenteStage();
        entente.setEmployeur(autre);
        entente.setEtudiant(etudiant);

        when(ententeStageRepository.findById(400L)).thenReturn(Optional.of(entente));

        EvaluationDTO dto = new EvaluationDTO();
        dto.setEntenteId(400L);

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class, () -> employeurService.creerEvaluation(dto));
    }

    @Test
    public void testGetEvaluationsPourEmployeur_Succes() throws Exception {
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
        when(employeur.getId()).thenReturn(11L);
        when(employeurRepository.findByEmail("employeur@test.com")).thenReturn(employeur);

        Evaluation eval1 = new Evaluation();
        Evaluation eval2 = new Evaluation();
        when(evaluationRepository.findAllByEmployeurId(11L)).thenReturn(Arrays.asList(eval1, eval2));

        // Act
        var result = employeurService.getEvaluationsPourEmployeur();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(evaluationRepository, times(1)).findAllByEmployeurId(11L);
    }
}
