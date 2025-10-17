package com.backend.service;

import com.backend.Exceptions.*;
import com.backend.config.JwtTokenProvider;
import com.backend.modele.*;
import com.backend.persistence.CandidatureRepository;
import com.backend.persistence.EmployeurRepository;
import com.backend.persistence.OffreRepository;
import com.backend.persistence.UtilisateurRepository;
import com.backend.persistence.ConvocationEntrevueRepository;
import com.backend.service.DTO.AuthResponseDTO;
import com.backend.service.DTO.CandidatureDTO;
import com.backend.service.DTO.ConvocationEntrevueDTO;
import com.backend.service.DTO.ProgrammeDTO;
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

    @Test
    public void testCreationEmployeur() throws MotPasseInvalideException {
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
    public void testCreationEmployeur_DeuxComptesMemeEmail() throws MotPasseInvalideException {
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
            ProgrammeDTO.P410_A1, "lieu", "rem", LocalDate.of(2024, 5, 1));

        verify(offreRepository, times(1)).save(any(Offre.class));
    }

    @Test
    public void testCreerOffreDeStage_NonEmployeur() {
        AuthResponseDTO utilisateur = new AuthResponseDTO("Bearer fakeToken");
        when(jwtTokenProvider.isEmployeur(anyString(), any())).thenReturn(false);

        assertThrows(ActionNonAutoriseeException.class, () -> {
            employeurService.creerOffreDeStage(utilisateur, "titre", "desc",
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 6, 1),
                ProgrammeDTO.P500_AF, "lieu", "rem", LocalDate.of(2024, 5, 1));
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

        when(authentication.getName()).thenReturn(email);
        when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(employeurRepository.findByEmail(email)).thenReturn(employeur);

        Etudiant etudiant = new Etudiant("etudiant@test.com", "pass", "tel",
                "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");

        Offre offre = new Offre("Titre", "Description",
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 6, 1),
                Programme.P420_B0, "lieu", "rem", LocalDate.of(2024, 5, 1), employeur);

        Candidature candidature = new Candidature(etudiant, offre, null);
        Long candidatureId = 1L;

        when(candidatureRepository.findById(candidatureId))
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

        Candidature candidature = new Candidature(etudiant, offre, "lettre".getBytes());
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
                    ProgrammeDTO.P410_A1, "lieu", "rem", LocalDate.of(2024, 5, 1));
        });
    }

    @Test
    public void testCreerConvocation_Succes() throws Exception {
        // Arrange
        Candidature candidature = new Candidature();
        candidature.setId(1L);
        Offre offre = mock(Offre.class);
        candidature.setOffre(offre);

        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        dto.candidatureId = 1L;

        when(candidatureRepository.findById(1L)).thenReturn(Optional.of(candidature));
        when(convocationEntrevueRepository.save(any(ConvocationEntrevue.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act & Assert
        assertDoesNotThrow(() -> employeurService.creerConvocation(dto));
    }

    @Test
    public void testCreerConvocation_CandidatureNonTrouvee() {
        // Arrange
        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        dto.candidatureId = 2L;
        when(candidatureRepository.findById(2L)).thenReturn(Optional.empty());
        // Act & Assert
        assertThrows(CandidatureNonTrouveeException.class, () -> employeurService.creerConvocation(dto));
    }

    @Test
    public void testCreerConvocation_DejaExistante() {
        // Arrange
        Offre offre = mock(Offre.class);
        Candidature candidature = new Candidature();
        candidature.setId(3L);
        candidature.setOffre(offre);
        ConvocationEntrevue convocation = new ConvocationEntrevue();
        candidature.setConvocationEntrevue(convocation);
        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        dto.candidatureId = 3L;
        when(candidatureRepository.findById(3L)).thenReturn(Optional.of(candidature));
        // Act & Assert
        assertThrows(ConvocationDejaExistanteException.class, () -> employeurService.creerConvocation(dto));
    }

    @Test
    public void testModifierConvocation_Succes() {
        // Arrange
        Offre offre = mock(Offre.class);
        Candidature candidature = new Candidature();
        candidature.setId(4L);
        candidature.setOffre(offre);
        ConvocationEntrevue convocation = new ConvocationEntrevue();
        candidature.setConvocationEntrevue(convocation);
        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        dto.candidatureId = 4L;
        when(candidatureRepository.findById(4L)).thenReturn(Optional.of(candidature));
        when(convocationEntrevueRepository.save(any(ConvocationEntrevue.class))).thenAnswer(inv -> inv.getArgument(0));
        // Act & Assert
        assertDoesNotThrow(() -> employeurService.modifierConvocation(dto));
    }

    @Test
    public void testModifierConvocation_CandidatureNonTrouvee() {
        // Arrange
        ConvocationEntrevueDTO dto = new ConvocationEntrevueDTO();
        dto.candidatureId = 5L;
        when(candidatureRepository.findById(5L)).thenReturn(Optional.empty());
        // Act & Assert
        assertThrows(CandidatureNonTrouveeException.class, () -> employeurService.modifierConvocation(dto));
    }

    @Test
    public void testAnnulerConvocation_Succes() {
        // Arrange
        Offre offre = mock(Offre.class);
        Candidature candidature = new Candidature();
        candidature.setId(6L);
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
        // Arrange
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
}
