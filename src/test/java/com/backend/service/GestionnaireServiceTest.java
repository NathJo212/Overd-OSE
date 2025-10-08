package com.backend.service;

import com.backend.Exceptions.*;
import com.backend.modele.Etudiant;
import com.backend.modele.Offre;
import com.backend.modele.Programme;
import com.backend.persistence.EtudiantRepository;
import com.backend.persistence.OffreRepository;
import org.junit.jupiter.api.BeforeEach;
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

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GestionnaireServiceTest {

    @Mock
    private OffreRepository offreRepository;

    @InjectMocks
    private GestionnaireService gestionnaireService;

    @Mock
    private EtudiantRepository etudiantRepository;

    @BeforeEach
    public void setupSecurityContext() {
        Authentication auth = mock(Authentication.class);
        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("GESTIONNAIRE")
        );
        lenient().when(auth.getAuthorities()).thenReturn((Collection) authorities);

        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(auth);

        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    public void approuveOffre_metAJourStatut() throws Exception {
        Offre offre = new Offre();
        offre.setId(1L);
        offre.setStatutApprouve(Offre.StatutApprouve.ATTENTE);
        when(offreRepository.findById(1L)).thenReturn(Optional.of(offre));

        gestionnaireService.approuveOffre(1L);

        assertEquals(Offre.StatutApprouve.APPROUVE, offre.getStatutApprouve());
        verify(offreRepository).save(offre);
    }

    @Test
    public void approuveOffre_OffreDejaVerifiee() {
        Offre offre = new Offre();
        offre.setId(1L);
        offre.setStatutApprouve(Offre.StatutApprouve.APPROUVE);
        when(offreRepository.findById(1L)).thenReturn(Optional.of(offre));

        assertThrows(OffreDejaVerifieException.class, () -> gestionnaireService.approuveOffre(1L));
    }

    @Test
    public void approuveOffre_OffreNonExistante() {
        when(offreRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(OffreNonExistantException.class, () -> gestionnaireService.approuveOffre(99L));
    }

    @Test
    public void refuseOffre_enregistreMessageRefus() throws Exception {
        Offre offre = new Offre();
        offre.setId(2L);
        offre.setStatutApprouve(Offre.StatutApprouve.ATTENTE);
        when(offreRepository.findById(2L)).thenReturn(Optional.of(offre));

        gestionnaireService.refuseOffre(2L, "Non conforme");

        assertEquals(Offre.StatutApprouve.REFUSE, offre.getStatutApprouve());
        assertEquals("Non conforme", offre.getMessageRefus());
        verify(offreRepository).save(offre);
    }

    @Test
    public void refuseOffre_OffreDejaVerifiee() {
        Offre offre = new Offre();
        offre.setId(2L);
        offre.setStatutApprouve(Offre.StatutApprouve.REFUSE);
        when(offreRepository.findById(2L)).thenReturn(Optional.of(offre));

        assertThrows(OffreDejaVerifieException.class, () -> gestionnaireService.refuseOffre(2L, "msg"));
    }

    @Test
    public void refuseOffre_OffreNonExistante() {
        when(offreRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(OffreNonExistantException.class, () -> gestionnaireService.refuseOffre(99L, "msg"));
    }

    @Test
    public void getOffresAttente_retourneListe() throws Exception {
        com.backend.modele.Employeur employeur = mock(com.backend.modele.Employeur.class);
        when(employeur.getEmail()).thenReturn("employeur@test.com");

        Offre offre = new Offre(
                "Développeur java",
                "Dev java/spring",
                LocalDate.of(2026, 1, 16),
                LocalDate.of(2026, 1, 17),
                Programme.P420_B0,
                "Montréal",
                "25$/h",
                LocalDate.of(2025, 9, 10),
                employeur
        );

        when(offreRepository.findByStatutApprouve(Offre.StatutApprouve.ATTENTE)).thenReturn(Arrays.asList(offre));

        var result = gestionnaireService.getOffresAttente();

        assertEquals(1, result.size());
        assertEquals("employeur@test.com", result.get(0).getEmployeurDTO().getEmail());
    }

    @Test
    public void getAllOffres_retourneToutesLesOffres() throws Exception {
        com.backend.modele.Employeur employeur1 = mock(com.backend.modele.Employeur.class);
        when(employeur1.getEmail()).thenReturn("employeur1@test.com");

        com.backend.modele.Employeur employeur2 = mock(com.backend.modele.Employeur.class);
        when(employeur2.getEmail()).thenReturn("employeur2@test.com");

        Offre offreApprouvee = new Offre(
                "Stage approuvé",
                "Description stage approuvé",
                LocalDate.of(2026, 1, 16),
                LocalDate.of(2026, 1, 17),
                Programme.P420_B0,
                "Montréal",
                "25$/h",
                LocalDate.of(2025, 12, 10),
                employeur1
        );
        offreApprouvee.setStatutApprouve(Offre.StatutApprouve.APPROUVE);

        Offre offreEnAttente = new Offre(
                "Stage en attente",
                "Description stage en attente",
                LocalDate.of(2026, 2, 16),
                LocalDate.of(2026, 2, 17),
                Programme.P420_B0,
                "Québec",
                "30$/h",
                LocalDate.of(2025, 11, 15),
                employeur2
        );
        offreEnAttente.setStatutApprouve(Offre.StatutApprouve.ATTENTE);

        when(offreRepository.findAll()).thenReturn(Arrays.asList(offreApprouvee, offreEnAttente));

        var result = gestionnaireService.getAllOffres();

        assertEquals(2, result.size());
        assertEquals("employeur1@test.com", result.get(0).getEmployeurDTO().getEmail());
        assertEquals("employeur2@test.com", result.get(1).getEmployeurDTO().getEmail());
        assertEquals("Stage approuvé", result.get(0).getTitre());
        assertEquals("Stage en attente", result.get(1).getTitre());
    }

    @Test
    public void approuveOffre_AccesNonAutorise() {
        // Simule un utilisateur sans le rôle GESTIONNAIRE
        Authentication auth = mock(Authentication.class);
        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        assertThrows(ActionNonAutoriseeException.class, () -> gestionnaireService.approuveOffre(1L));
    }

    @Test
    public void approuveCV_metAJourStatut() throws Exception {
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getCv()).thenReturn(new byte[]{1, 2, 3});
        when(etudiant.getStatutCV()).thenReturn(Etudiant.StatutCV.ATTENTE);

        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));

        gestionnaireService.approuveCV(1L);

        verify(etudiant).setStatutCV(Etudiant.StatutCV.APPROUVE);
        verify(etudiant).setMessageRefusCV(null);
        verify(etudiantRepository).save(etudiant);
    }

    @Test
    public void approuveCV_CVNonExistant_etudiantInexistant() {
        when(etudiantRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(CVNonExistantException.class, () -> gestionnaireService.approuveCV(99L));
    }

    @Test
    public void approuveCV_CVNonExistant_cvNull() {
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getCv()).thenReturn(null);

        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));

        assertThrows(CVNonExistantException.class, () -> gestionnaireService.approuveCV(1L));
    }

    @Test
    public void approuveCV_CVNonExistant_cvVide() {
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getCv()).thenReturn(new byte[0]);

        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));

        assertThrows(CVNonExistantException.class, () -> gestionnaireService.approuveCV(1L));
    }

    @Test
    public void approuveCV_CVDejaVerifie_dejaApprouve() {
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getCv()).thenReturn(new byte[]{1, 2, 3});
        when(etudiant.getStatutCV()).thenReturn(Etudiant.StatutCV.APPROUVE);

        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));

        assertThrows(CVDejaVerifieException.class, () -> gestionnaireService.approuveCV(1L));
    }

    @Test
    public void approuveCV_CVDejaVerifie_dejaRefuse() {
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getCv()).thenReturn(new byte[]{1, 2, 3});
        when(etudiant.getStatutCV()).thenReturn(Etudiant.StatutCV.REFUSE);

        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));

        assertThrows(CVDejaVerifieException.class, () -> gestionnaireService.approuveCV(1L));
    }

    @Test
    public void approuveCV_AccesNonAutorise() {
        Authentication auth = mock(Authentication.class);
        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        assertThrows(ActionNonAutoriseeException.class, () -> gestionnaireService.approuveCV(1L));
    }

// CV Refusal Tests

    @Test
    public void refuseCV_enregistreMessageRefus() throws Exception {
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getCv()).thenReturn(new byte[]{1, 2, 3});
        when(etudiant.getStatutCV()).thenReturn(Etudiant.StatutCV.ATTENTE);

        when(etudiantRepository.findById(2L)).thenReturn(Optional.of(etudiant));

        gestionnaireService.refuseCV(2L, "CV non conforme");

        verify(etudiant).setStatutCV(Etudiant.StatutCV.REFUSE);
        verify(etudiant).setMessageRefusCV("CV non conforme");
        verify(etudiantRepository).save(etudiant);
    }

    @Test
    public void refuseCV_CVNonExistant_etudiantInexistant() {
        when(etudiantRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(CVNonExistantException.class, () -> gestionnaireService.refuseCV(99L, "message"));
    }

    @Test
    public void refuseCV_CVNonExistant_cvNull() {
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getCv()).thenReturn(null);

        when(etudiantRepository.findById(2L)).thenReturn(Optional.of(etudiant));

        assertThrows(CVNonExistantException.class, () -> gestionnaireService.refuseCV(2L, "message"));
    }

    @Test
    public void refuseCV_CVNonExistant_cvVide() {
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getCv()).thenReturn(new byte[0]);

        when(etudiantRepository.findById(2L)).thenReturn(Optional.of(etudiant));

        assertThrows(CVNonExistantException.class, () -> gestionnaireService.refuseCV(2L, "message"));
    }

    @Test
    public void refuseCV_CVDejaVerifie_dejaApprouve() {
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getCv()).thenReturn(new byte[]{1, 2, 3});
        when(etudiant.getStatutCV()).thenReturn(Etudiant.StatutCV.APPROUVE);

        when(etudiantRepository.findById(2L)).thenReturn(Optional.of(etudiant));

        assertThrows(CVDejaVerifieException.class, () -> gestionnaireService.refuseCV(2L, "message"));
    }

    @Test
    public void refuseCV_CVDejaVerifie_dejaRefuse() {
        Etudiant etudiant = mock(Etudiant.class);
        when(etudiant.getCv()).thenReturn(new byte[]{1, 2, 3});
        when(etudiant.getStatutCV()).thenReturn(Etudiant.StatutCV.REFUSE);

        when(etudiantRepository.findById(2L)).thenReturn(Optional.of(etudiant));

        assertThrows(CVDejaVerifieException.class, () -> gestionnaireService.refuseCV(2L, "message"));
    }

    @Test
    public void refuseCV_AccesNonAutorise() {
        Authentication auth = mock(Authentication.class);
        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        assertThrows(ActionNonAutoriseeException.class, () -> gestionnaireService.refuseCV(2L, "message"));
    }

// Get CVs En Attente Tests

    @Test
    public void getCVsEnAttente_retourneListe() throws Exception {
        Etudiant etudiant1 = mock(Etudiant.class);
        when(etudiant1.getEmail()).thenReturn("etudiant1@test.com");

        Etudiant etudiant2 = mock(Etudiant.class);
        when(etudiant2.getEmail()).thenReturn("etudiant2@test.com");

        when(etudiantRepository.findAllByStatutCV(Etudiant.StatutCV.ATTENTE))
                .thenReturn(Arrays.asList(etudiant1, etudiant2));

        var result = gestionnaireService.getCVsEnAttente();

        assertEquals(2, result.size());
        assertEquals("etudiant1@test.com", result.get(0).getEmail());
        assertEquals("etudiant2@test.com", result.get(1).getEmail());
    }

    @Test
    public void getCVsEnAttente_listeVide() throws Exception {
        when(etudiantRepository.findAllByStatutCV(Etudiant.StatutCV.ATTENTE))
                .thenReturn(Collections.emptyList());

        var result = gestionnaireService.getCVsEnAttente();

        assertTrue(result.isEmpty());
    }

    @Test
    public void getCVsEnAttente_AccesNonAutorise() {
        Authentication auth = mock(Authentication.class);
        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        assertThrows(ActionNonAutoriseeException.class, () -> gestionnaireService.getCVsEnAttente());
    }


    @Test
    public void getAllOffres_AccesNonAutorise() {
        Authentication auth = mock(Authentication.class);
        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        assertThrows(ActionNonAutoriseeException.class, () -> gestionnaireService.getAllOffres());
    }

    @Test
    public void getOffresAttente_AccesNonAutorise() {
        Authentication auth = mock(Authentication.class);
        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        assertThrows(ActionNonAutoriseeException.class, () -> gestionnaireService.getOffresAttente());
    }
}
