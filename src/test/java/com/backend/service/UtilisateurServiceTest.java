package com.backend.service;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.AuthenticationException;
import com.backend.Exceptions.UtilisateurPasTrouveException;
import com.backend.config.JwtTokenProvider;
import com.backend.modele.*;
import com.backend.persistence.*;
import com.backend.service.DTO.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UtilisateurServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private UtilisateurService utilisateurService;

    @Mock
    private EtudiantRepository etudiantRepository;

    @Mock
    private EmployeurRepository employeurRepository;

    @Mock
    private ProfesseurRepository professeurRepository;

    @Mock
    private GestionnaireRepository gestionnaireRepository;

    @Test
    public void testAuthentificationEmployeur_Success() throws AuthenticationException {
        // Arrange
        String email = "employeur@test.com";
        String password = "Password123!";
        String token = "jwt.token.here";

        Employeur employeur = new Employeur(email, password, "5149749308", "Test Entreprise", "John Doe");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication)).thenReturn(token);
        when(utilisateurRepository.findByEmail(email)).thenReturn(Optional.of(employeur));

        // Act
        AuthResponseDTO result = utilisateurService.authentifierUtilisateur(email, password);

        // Assert
        assertNotNull(result);
        assertEquals(token, result.getToken());
        assertNotNull(result.getUtilisateurDTO());
        assertEquals(email, result.getUtilisateurDTO().getEmail());
        assertEquals("Test Entreprise", result.getUtilisateurDTO().getNomEntreprise());
        assertEquals("John Doe", result.getUtilisateurDTO().getContact());

        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtTokenProvider, times(1)).generateToken(authentication);
        verify(utilisateurRepository, times(1)).findByEmail(email);
    }

    @Test
    public void testAuthentificationEtudiant_Success() throws AuthenticationException {
        // Arrange
        String email = "etudiant@test.com";
        String password = "Password123!";
        String token = "jwt.token.here";

        Etudiant etudiant = new Etudiant(email, password, "5149749308", "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication)).thenReturn(token);
        when(utilisateurRepository.findByEmail(email)).thenReturn(Optional.of(etudiant));

        // Act
        AuthResponseDTO result = utilisateurService.authentifierUtilisateur(email, password);

        // Assert
        assertNotNull(result);
        assertEquals(token, result.getToken());
        assertNotNull(result.getUtilisateurDTO());
        assertEquals(email, result.getUtilisateurDTO().getEmail());
        assertEquals("Jean", result.getUtilisateurDTO().getPrenom());
        assertEquals("Dupont", result.getUtilisateurDTO().getNom());
        assertEquals(ProgrammeDTO.P420_B0, result.getUtilisateurDTO().getProgEtude());
        assertEquals("Automne", result.getUtilisateurDTO().getSession());
        assertEquals("2024", result.getUtilisateurDTO().getAnnee());

        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtTokenProvider, times(1)).generateToken(authentication);
        verify(utilisateurRepository, times(1)).findByEmail(email);
    }

    @Test
    public void testAuthentification_InvalidCredentials() {
        // Arrange
        String email = "test@test.com";
        String password = "wrongPassword";

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        // Act & Assert
        assertThrows(AuthenticationException.class, () -> utilisateurService.authentifierUtilisateur(email, password));

        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtTokenProvider, never()).generateToken(any());
        verify(utilisateurRepository, never()).findByEmail(anyString());
    }

    @Test
    public void testAuthentification_UtilisateurNotFound() {
        // Arrange
        String email = "inexistant@test.com";
        String password = "Password123!";

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication)).thenReturn("token");
        when(utilisateurRepository.findByEmail(email)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(AuthenticationException.class, () -> utilisateurService.authentifierUtilisateur(email, password));

        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtTokenProvider, times(1)).generateToken(authentication);
        verify(utilisateurRepository, times(1)).findByEmail(email);
    }


    @Test
    public void testAuthentification_JwtGenerationError() {
        // Arrange
        String email = "test@test.com";
        String password = "Password123!";

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication))
                .thenThrow(new RuntimeException("JWT generation failed"));

        // Act & Assert
        assertThrows(AuthenticationException.class, () -> utilisateurService.authentifierUtilisateur(email, password));

        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtTokenProvider, times(1)).generateToken(authentication);
        verify(utilisateurRepository, never()).findByEmail(anyString());
    }

    @Test
    public void testAuthentification_GeneralException() {
        // Arrange
        String email = "test@test.com";
        String password = "Password123!";

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new RuntimeException("Unexpected error"));

        // Act & Assert
        assertThrows(AuthenticationException.class, () -> utilisateurService.authentifierUtilisateur(email, password));

        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtTokenProvider, never()).generateToken(any());
        verify(utilisateurRepository, never()).findByEmail(anyString());
    }

    @Test
    public void testAuthentification_EmptyCredentials() {
        // Arrange
        String email = "";
        String password = "";

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Empty credentials"));

        // Act & Assert
        assertThrows(AuthenticationException.class, () -> utilisateurService.authentifierUtilisateur(email, password));

        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtTokenProvider, never()).generateToken(any());
        verify(utilisateurRepository, never()).findByEmail(anyString());
    }

    @Test
    public void testLogout_callsJwtTokenProviderLogout() {
        String token = "jwt.token.here";
        doNothing().when(jwtTokenProvider).logout(token);

        assertDoesNotThrow(() -> utilisateurService.logout(token));
        verify(jwtTokenProvider, times(1)).logout(token);
    }

    @Test
    public void testLogout_throwsExceptionIfProviderFails() {
        String token = "jwt.token.here";
        doThrow(new RuntimeException("Erreur")).when(jwtTokenProvider).logout(token);

        assertThrows(RuntimeException.class, () -> utilisateurService.logout(token));
        verify(jwtTokenProvider, times(1)).logout(token);
    }


    @Test
    public void testGetAllProgrammes_ReturnsAllProgrammeKeys() {
        // Act
        List<String> result = utilisateurService.getAllProgrammes();

        // Assert
        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertEquals(ProgrammeDTO.values().length, result.size());

        assertTrue(result.contains("P180_A0"));
        assertTrue(result.contains("P180_B0"));
        assertTrue(result.contains("P200_B1"));
        assertTrue(result.contains("P200_Z1"));
        assertTrue(result.contains("P420_B0"));

        verifyNoInteractions(authenticationManager);
        verifyNoInteractions(jwtTokenProvider);
        verifyNoInteractions(utilisateurRepository);
    }

    @Test
    public void testGetAllProgrammes_ReturnsListInCorrectFormat() {
        // Act
        List<String> result = utilisateurService.getAllProgrammes();

        // Assert
        assertNotNull(result);
        assertTrue(result instanceof List);

        for (Object item : result) {
            assertTrue(item instanceof String);
        }
    }

    @Test
    public void testGetAllProgrammes_ContainsAllExpectedProgrammes() {
        // Arrange
        Set<String> expectedProgrammes = Stream.of(ProgrammeDTO.values())
                .map(ProgrammeDTO::name)
                .collect(Collectors.toSet());

        // Act
        List<String> result = utilisateurService.getAllProgrammes();

        // Assert
        assertNotNull(result);
        assertEquals(expectedProgrammes.size(), result.size());

        for (String expected : expectedProgrammes) {
            assertTrue(result.contains(expected),
                    "Result should contain programme: " + expected);
        }
    }

    @Test
    public void testGetAllProgrammes_IsConsistent() {
        List<String> result1 = utilisateurService.getAllProgrammes();
        List<String> result2 = utilisateurService.getAllProgrammes();
        List<String> result3 = utilisateurService.getAllProgrammes();

        assertNotNull(result1);
        assertNotNull(result2);
        assertNotNull(result3);

        assertEquals(result1.size(), result2.size());
        assertEquals(result2.size(), result3.size());

        assertTrue(result1.containsAll(result2));
        assertTrue(result2.containsAll(result3));
    }

    @Test
    public void testSearchUsersByCategory_AllCategory_ReturnsAllUsers() throws Exception {
        // Arrange
        Authentication auth = mock(Authentication.class);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("GESTIONNAIRE")))
                .when(auth).getAuthorities();
        when(auth.isAuthenticated()).thenReturn(true);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        Etudiant etudiant = new Etudiant("etu@test.com", "pass", "tel", "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");
        Employeur employeur = new Employeur("emp@test.com", "pass", "tel", "Google", "Contact");
        Professeur professeur = new Professeur("prof@test.com", "pass", "tel", "Martin", "Pierre");
        GestionnaireStage gestionnaire = new GestionnaireStage("gest@test.com", "pass", "tel", "Gagnon", "Sophie");

        when(etudiantRepository.findAll()).thenReturn(Collections.singletonList(etudiant));
        when(employeurRepository.findAll()).thenReturn(Collections.singletonList(employeur));
        when(professeurRepository.findAll()).thenReturn(Collections.singletonList(professeur));
        when(gestionnaireRepository.findAll()).thenReturn(Collections.singletonList(gestionnaire));

        // Act
        Map<String, Object> result = utilisateurService.searchUsersByCategory("", "ALL");

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("etudiants"));
        assertTrue(result.containsKey("employeurs"));
        assertTrue(result.containsKey("professeurs"));
        assertTrue(result.containsKey("gestionnaires"));

        List<?> etudiants = (List<?>) result.get("etudiants");
        assertEquals(1, etudiants.size());
    }

    @Test
    public void testSearchUsersByCategory_EtudiantCategory_ReturnsOnlyEtudiants() throws Exception {
        // Arrange
        Authentication auth = mock(Authentication.class);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("GESTIONNAIRE")))
                .when(auth).getAuthorities();
        when(auth.isAuthenticated()).thenReturn(true);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        Etudiant etudiant = new Etudiant("jean@test.com", "pass", "tel", "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");
        when(etudiantRepository.findAll()).thenReturn(Collections.singletonList(etudiant));

        // Act
        Map<String, Object> result = utilisateurService.searchUsersByCategory("jean", "ETUDIANT");

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("etudiants"));
        assertFalse(result.containsKey("employeurs"));
    }

    @Test
    public void testSearchUsersByCategory_EtudiantBlocked_ThrowsException() {
        // Arrange
        Authentication auth = mock(Authentication.class);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ETUDIANT")))
                .when(auth).getAuthorities();
        when(auth.isAuthenticated()).thenReturn(true);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class,
                () -> utilisateurService.searchUsersByCategory("test", "ETUDIANT"));
    }

    @Test
    public void testSearchUsersByCategory_AllCategoryExcludesEtudiantsForEtudiant() throws Exception {
        // Arrange
        Authentication auth = mock(Authentication.class);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ETUDIANT")))
                .when(auth).getAuthorities();
        when(auth.isAuthenticated()).thenReturn(true);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        Employeur employeur = new Employeur("emp@test.com", "pass", "tel", "Google", "Contact");
        when(employeurRepository.findAll()).thenReturn(Collections.singletonList(employeur));
        when(professeurRepository.findAll()).thenReturn(Collections.emptyList());
        when(gestionnaireRepository.findAll()).thenReturn(Collections.emptyList());

        // Act
        Map<String, Object> result = utilisateurService.searchUsersByCategory("", "ALL");

        // Assert
        assertNotNull(result);
        assertFalse(result.containsKey("etudiants")); // Etudiants should NOT be included
        assertTrue(result.containsKey("employeurs"));
        verify(etudiantRepository, never()).findAll(); // Never called for ETUDIANT users
    }

    @Test
    public void testSearchUsersByCategory_InvalidCategory_ThrowsException() {
        // Arrange
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("GESTIONNAIRE")))
                .when(auth).getAuthorities();

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> utilisateurService.searchUsersByCategory("test", "INVALID"));
    }

    @Test
    public void testSearchUsersByCategory_NotAuthenticated_ThrowsException() {
        // Arrange
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(null);
        SecurityContextHolder.setContext(securityContext);

        // Act & Assert
        assertThrows(ActionNonAutoriseeException.class,
                () -> utilisateurService.searchUsersByCategory("test", "ALL"));
    }

    @Test
    public void testGetEtudiantInfo_Success() throws Exception {
        // Arrange
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("GESTIONNAIRE")))
                .when(auth).getAuthorities();

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        Etudiant etudiant = new Etudiant("etu@test.com", "pass", "tel", "Jean", "Dupont", Programme.P420_B0, "Automne", "2024");
        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));

        // Act
        EtudiantDTO result = utilisateurService.getEtudiantInfo(1L);

        // Assert
        assertNotNull(result);
        assertEquals("etu@test.com", result.getEmail());
        assertEquals("Jean", result.getPrenom());
        assertEquals("Dupont", result.getNom());
    }

    @Test
    public void testGetEtudiantInfo_NotFound_ThrowsException() {
        // Arrange
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("GESTIONNAIRE")))
                .when(auth).getAuthorities();

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        when(etudiantRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(UtilisateurPasTrouveException.class,
                () -> utilisateurService.getEtudiantInfo(99L));
    }

    @Test
    public void testGetEmployeurInfo_Success() throws Exception {
        // Arrange
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("GESTIONNAIRE")))
                .when(auth).getAuthorities();

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        Employeur employeur = new Employeur("emp@test.com", "pass", "tel", "Google", "Contact");
        when(employeurRepository.findById(1L)).thenReturn(Optional.of(employeur));

        // Act
        EmployeurDTO result = utilisateurService.getEmployeurInfo(1L);

        // Assert
        assertNotNull(result);
        assertEquals("emp@test.com", result.getEmail());
        assertEquals("Google", result.getNomEntreprise());
    }

    @Test
    public void testGetProfesseurInfo_Success() throws Exception {
        // Arrange
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("GESTIONNAIRE")))
                .when(auth).getAuthorities();

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        Professeur professeur = new Professeur("prof@test.com", "pass", "tel", "Dupont", "Pierre");
        when(professeurRepository.findById(1L)).thenReturn(Optional.of(professeur));

        // Act
        ProfesseurDTO result = utilisateurService.getProfesseurInfo(1L);

        // Assert
        assertNotNull(result);
        assertEquals("prof@test.com", result.getEmail());
        assertEquals("Dupont", result.getNom());
    }

    @Test
    public void testGetGestionnaireInfo_Success() throws Exception {
        // Arrange
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("PROFESSEUR")))
                .when(auth).getAuthorities();

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        GestionnaireStage gestionnaire = new GestionnaireStage("gest@test.com", "pass", "tel", "Martin", "Claire");
        when(gestionnaireRepository.findById(1L)).thenReturn(Optional.of(gestionnaire));

        // Act
        GestionnaireDTO result = utilisateurService.getGestionnaireInfo(1L);

        // Assert
        assertNotNull(result);
        assertEquals("gest@test.com", result.getEmail());
        assertEquals("Martin", result.getNom());
    }


}