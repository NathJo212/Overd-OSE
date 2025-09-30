package com.backend.service;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.Exceptions.UtilisateurPasTrouveException;
import com.backend.modele.Etudiant;
import com.backend.modele.Programme;
import com.backend.persistence.EtudiantRepository;
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

import java.util.Collection;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EtudiantServiceTest {
    @Mock
    private EtudiantRepository etudiantRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private EtudiantService etudiantService;

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
        when(etudiantRepository.existsByEmail(etudiant.getEmail())).thenReturn(false);
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
        when(etudiantRepository.existsByEmail(etudiant.getEmail())).thenReturn(false);

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
        when(etudiantRepository.existsByEmail(email)).thenReturn(false);
        when(passwordEncoder.encode(any(CharSequence.class))).thenReturn("encodedPassword");
        when(etudiantRepository.save(any(Etudiant.class))).thenReturn(etudiant);

        // Premier compte créé sans exception
        etudiantService.creerEtudiant(etudiant.getEmail(), etudiant.getPassword(), etudiant.getTelephone(), etudiant.getPrenom(), etudiant.getNom(),  ProgrammeDTO.P200_B1, etudiant.getSession(), etudiant.getAnnee());

        // Simule que l'email existe déjà pour le deuxième compte
        when(etudiantRepository.existsByEmail(email)).thenReturn(true);

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

        EtudiantService spyService = spy(etudiantService);
        doReturn("CV en bytes".getBytes())
                .when(spyService)
                .dechiffrer(anyString());

        // Act
        var cvDTO = spyService.getCvEtudiantConnecte();

        // Assert
        assertNotNull(cvDTO);
        assertArrayEquals("CV en bytes".getBytes(), cvDTO.getCv());
    }

}
