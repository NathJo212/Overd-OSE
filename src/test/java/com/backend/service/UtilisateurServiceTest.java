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

import java.util.Optional;

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
    public void testAuthentificationEmployeur_Success() {
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
    public void testAuthentificationEtudiant_Success() {
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
}