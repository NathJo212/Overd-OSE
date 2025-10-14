package com.backend.service;

import com.backend.Exceptions.*;
import com.backend.config.JwtTokenProvider;
import com.backend.modele.*;
import com.backend.persistence.CandidatureRepository;
import com.backend.persistence.EmployeurRepository;
import com.backend.persistence.OffreRepository;
import com.backend.persistence.UtilisateurRepository;
import com.backend.service.DTO.AuthResponseDTO;
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
}
