package com.backend.service;

import com.backend.Exceptions.AuthenticationException;
import com.backend.config.JwtTokenProvider;
import com.backend.modele.Employeur;
import com.backend.modele.Etudiant;
import com.backend.modele.Programme;
import com.backend.persistence.UtilisateurRepository;
import com.backend.service.DTO.AuthResponseDTO;
import com.backend.service.DTO.ProgrammeDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;
import java.util.Set;
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


}