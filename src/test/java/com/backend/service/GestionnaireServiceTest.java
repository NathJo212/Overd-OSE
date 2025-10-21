package com.backend.service;

import com.backend.Exceptions.*;
import com.backend.modele.*;
import com.backend.persistence.*;
import com.backend.service.DTO.EntenteStageDTO;
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

import static java.util.Arrays.asList;
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

    @Mock
    private EntenteStageRepository ententeStageRepository;

    @Mock
    private CandidatureRepository candidatureRepository;

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
                LocalDate.of(2027, 1, 16),
                LocalDate.of(2027, 1, 17),
                Programme.P420_B0,
                "Montréal",
                "25$/h",
                LocalDate.of(2026, 9, 10),
                employeur
        );

        when(offreRepository.findByStatutApprouve(Offre.StatutApprouve.ATTENTE)).thenReturn(asList(offre));

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

        when(offreRepository.findAll()).thenReturn(asList(offreApprouvee, offreEnAttente));

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


    @Test
    public void getCVsEnAttente_retourneListe() throws Exception {
        Etudiant etudiant1 = mock(Etudiant.class);
        when(etudiant1.getEmail()).thenReturn("etudiant1@test.com");

        Etudiant etudiant2 = mock(Etudiant.class);
        when(etudiant2.getEmail()).thenReturn("etudiant2@test.com");

        when(etudiantRepository.findAllByStatutCV(Etudiant.StatutCV.ATTENTE))
                .thenReturn(asList(etudiant1, etudiant2));

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

    @Test
    public void getCandidaturesEligiblesEntente_retourneListe() throws Exception {
        com.backend.modele.Employeur emp1 = mock(com.backend.modele.Employeur.class);
        lenient().when(emp1.getContact()).thenReturn("contact1");
        lenient().when(emp1.getEmail()).thenReturn("emp1@test.com");

        com.backend.modele.Employeur emp2 = mock(com.backend.modele.Employeur.class);
        lenient().when(emp2.getContact()).thenReturn("contact2");
        lenient().when(emp2.getEmail()).thenReturn("emp2@test.com");

        Offre offre1 = new Offre();
        offre1.setId(101L);
        offre1.setEmployeur(emp1);

        Offre offre2 = new Offre();
        offre2.setId(102L);
        offre2.setEmployeur(emp2);

        Etudiant etu1 = mock(Etudiant.class);
        when(etu1.getId()).thenReturn(5L);
        when(etu1.getEmail()).thenReturn("etu1@test.com");

        Etudiant etu2 = mock(Etudiant.class);
        when(etu2.getId()).thenReturn(6L);
        when(etu2.getEmail()).thenReturn("etu2@test.com");

        Candidature c1 = new Candidature();
        c1.setOffre(offre1);
        c1.setEtudiant(etu1);
        c1.setStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT);

        Candidature c2 = new Candidature();
        c2.setOffre(offre2);
        c2.setEtudiant(etu2);
        c2.setStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT);

        when(candidatureRepository.findByStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT))
                .thenReturn(asList(c1, c2));

        var result = gestionnaireService.getCandidaturesEligiblesEntente();
        assertEquals(2, result.size());
    }
    @Test
    public void getCandidaturesEligiblesEntente_etudiantNull_lanceNPE() {
        // Offre valide avec employeur mocké
        com.backend.modele.Employeur emp = mock(com.backend.modele.Employeur.class);
        lenient().when(emp.getContact()).thenReturn("contact");
        Offre offre = new Offre();
        offre.setId(201L);
        offre.setEmployeur(emp);

        // Candidature sans étudiant -> toDTO() provoquera NPE
        Candidature c = new Candidature();
        c.setOffre(offre);
        c.setEtudiant(null);
        c.setStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT);

        when(candidatureRepository.findByStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT))
                .thenReturn(asList(c));

        assertThrows(NullPointerException.class, () -> gestionnaireService.getCandidaturesEligiblesEntente());
    }

    @Test
    public void getCandidaturesEligiblesEntente_offreSansEmployeur_lanceNPE() {
        // Offre sans employeur
        Offre offreSansEmp = new Offre();
        offreSansEmp.setId(202L);
        offreSansEmp.setEmployeur(null);

        // Etudiant mocké valide (stubbings rendus lenient pour éviter UnnecessaryStubbingException)
        Etudiant etu = mock(Etudiant.class);
        lenient().when(etu.getId()).thenReturn(10L);
        lenient().when(etu.getEmail()).thenReturn("badcase@test.com");

        // Candidature avec offre sans employeur -> toDTO() provoquera NPE
        Candidature c = new Candidature();
        c.setOffre(offreSansEmp);
        c.setEtudiant(etu);
        c.setStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT);

        when(candidatureRepository.findByStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT))
                .thenReturn(asList(c));

        assertThrows(NullPointerException.class, () -> gestionnaireService.getCandidaturesEligiblesEntente());
    }


    @Test
    public void creerEntente_creeEtSauvegarde() throws Exception {
        Employeur employeur = new Employeur();
        employeur.setEmail("emp@test.com");

        Offre offre = new Offre();
        offre.setId(10L);
        offre.setTitre("Titre Offre");
        offre.setEmployeur(employeur);

        when(offreRepository.findById(10L)).thenReturn(Optional.of(offre));

        Etudiant etudiant = new Etudiant();
        etudiant.setEmail("etu@test.com");

        when(etudiantRepository.findById(5L)).thenReturn(Optional.of(etudiant));

        Candidature candidature = new Candidature();
        candidature.setId(7L);
        candidature.setEtudiant(etudiant);
        candidature.setOffre(offre);
        candidature.setStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT);

        when(candidatureRepository.findByEtudiantAndOffre(etudiant, offre)).thenReturn(Optional.of(candidature));
        when(ententeStageRepository.existsByEtudiantAndOffreAndArchivedFalse(etudiant, offre)).thenReturn(false);

        EntenteStageDTO dto = new EntenteStageDTO();
        dto.setOffreId(10L);
        dto.setEtudiantId(5L);
        dto.setTitre("Entente X");
        dto.setDescription("Desc");
        dto.setDateDebut(LocalDate.now());
        dto.setDateFin(LocalDate.now().plusMonths(3));

        gestionnaireService.creerEntente(dto);

        verify(ententeStageRepository, atLeastOnce()).save(any(EntenteStage.class));
    }

    @Test
    public void creerEntente_offreNonExistante_lance() throws Exception {
        EntenteStageDTO dto = new EntenteStageDTO();
        dto.setOffreId(99L);
        dto.setEtudiantId(1L);

        when(offreRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(OffreNonExistantException.class, () -> gestionnaireService.creerEntente(dto));
    }

    @Test
    public void creerEntente_ententeExistante_lance() throws Exception {
        Employeur employeur = new Employeur();
        Offre offre = new Offre();
        offre.setId(11L);
        offre.setEmployeur(employeur);

        Etudiant etudiant = new Etudiant();

        when(offreRepository.findById(11L)).thenReturn(Optional.of(offre));
        when(etudiantRepository.findById(6L)).thenReturn(Optional.of(etudiant));
        when(ententeStageRepository.existsByEtudiantAndOffreAndArchivedFalse(etudiant, offre)).thenReturn(true);

        EntenteStageDTO dto = new EntenteStageDTO();
        dto.setOffreId(11L);
        dto.setEtudiantId(6L);

        assertThrows(com.backend.Exceptions.EntenteDejaExistanteException.class, () -> gestionnaireService.creerEntente(dto));
    }

    @Test
    public void modifierEntente_modifieEtSauvegarde() throws Exception {
        Etudiant etu = new Etudiant();
        Employeur emp = new Employeur();
        Offre offre = new Offre();

        EntenteStage entente = new EntenteStage();
        entente.setId(20L);
        entente.setEtudiant(etu);
        entente.setEmployeur(emp);
        entente.setOffre(offre);
        entente.setStatut(EntenteStage.StatutEntente.EN_ATTENTE);

        when(ententeStageRepository.findById(20L)).thenReturn(Optional.of(entente));

        EntenteStageDTO dto = new EntenteStageDTO();
        dto.setTitre("NouveauTitre");
        dto.setDescription("NouvelleDesc");
        dto.setDateDebut(LocalDate.now());
        dto.setDateFin(LocalDate.now().plusDays(10));

        gestionnaireService.modifierEntente(20L, dto);

        verify(ententeStageRepository, atLeastOnce()).save(entente);
        assertEquals("NouveauTitre", entente.getTitre());
    }

    @Test
    public void modifierEntente_ententeNonTrouvee_lance() {
        when(ententeStageRepository.findById(999L)).thenReturn(Optional.empty());
        EntenteStageDTO dto = new EntenteStageDTO();
        assertThrows(EntenteNonTrouveException.class, () -> gestionnaireService.modifierEntente(999L, dto));
    }

    @Test
    public void modifierEntente_statutNonModifiable_lance() {
        EntenteStage entente = new EntenteStage();
        entente.setId(21L);
        entente.setStatut(EntenteStage.StatutEntente.SIGNEE);
        when(ententeStageRepository.findById(21L)).thenReturn(Optional.of(entente));
        EntenteStageDTO dto = new EntenteStageDTO();
        assertThrows(EntenteModificationNonAutoriseeException.class, () -> gestionnaireService.modifierEntente(21L, dto));
    }

    @Test
    public void annulerEntente_archiveEtNotifie() throws Exception {
        Etudiant etu = new Etudiant();
        Employeur emp = new Employeur();
        EntenteStage entente = new EntenteStage();
        entente.setId(30L);
        entente.setEtudiant(etu);
        entente.setEmployeur(emp);
        entente.setStatut(EntenteStage.StatutEntente.EN_ATTENTE);

        when(ententeStageRepository.findById(30L)).thenReturn(Optional.of(entente));

        gestionnaireService.annulerEntente(30L);

        verify(ententeStageRepository).save(entente);
        assertTrue(entente.isArchived());
        assertEquals(EntenteStage.StatutEntente.ANNULEE, entente.getStatut());
    }

    @Test
    public void annulerEntente_ententeNonTrouvee_lance() {
        when(ententeStageRepository.findById(404L)).thenReturn(Optional.empty());
        assertThrows(EntenteNonTrouveException.class, () -> gestionnaireService.annulerEntente(404L));
    }

    @Test
    public void getEntentesActives_retourneListe() throws Exception {
        EntenteStage e1 = new EntenteStage();
        e1.setId(1L);
        EntenteStage e2 = new EntenteStage();
        e2.setId(2L);
        when(ententeStageRepository.findByArchivedFalse()).thenReturn(asList(e1, e2));

        var result = gestionnaireService.getEntentesActives();
        assertEquals(2, result.size());
    }

    @Test
    public void getEntenteById_retourneDTO() throws Exception {
        EntenteStage e = new EntenteStage();
        e.setId(55L);
        when(ententeStageRepository.findById(55L)).thenReturn(Optional.of(e));

        var dto = gestionnaireService.getEntenteById(55L);
        assertEquals(55L, dto.getId());
    }

    @Test
    public void getEntenteDocument_retourneBytes_siPresent() throws Exception {
        EntenteStage e = new EntenteStage();
        e.setId(66L);
        e.setDocumentPdf(new byte[]{1,2,3});
        when(ententeStageRepository.findById(66L)).thenReturn(Optional.of(e));

        byte[] doc = gestionnaireService.getEntenteDocument(66L);
        assertArrayEquals(new byte[]{1,2,3}, doc);
    }

    @Test
    public void getEntenteDocument_absent_lance() throws Exception {
        EntenteStage e = new EntenteStage();
        e.setId(67L);
        e.setDocumentPdf(null);
        when(ententeStageRepository.findById(67L)).thenReturn(Optional.of(e));

        assertThrows(EntenteDocumentNonTrouveeException.class, () -> gestionnaireService.getEntenteDocument(67L));
    }
}
