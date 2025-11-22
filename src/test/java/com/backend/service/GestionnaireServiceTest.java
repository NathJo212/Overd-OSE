//package com.backend.service;
//
//import com.backend.Exceptions.*;
//import com.backend.modele.*;
//import com.backend.persistence.*;
//import com.backend.service.DTO.EntenteStageDTO;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.core.GrantedAuthority;
//import org.springframework.security.core.authority.SimpleGrantedAuthority;
//import org.springframework.security.core.context.SecurityContext;
//import org.springframework.security.core.context.SecurityContextHolder;
//
//import java.time.LocalDate;
//import java.util.*;
//
//import static java.util.Arrays.asList;
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.Mockito.*;
//
//@ExtendWith(MockitoExtension.class)
//public class GestionnaireServiceTest {
//
//    @Mock
//    private OffreRepository offreRepository;
//
//    @InjectMocks
//    private GestionnaireService gestionnaireService;
//
//    @Mock
//    private EtudiantRepository etudiantRepository;
//
//    @Mock
//    private EntenteStageRepository ententeStageRepository;
//
//    @Mock
//    private CandidatureRepository candidatureRepository;
//
//    @Mock
//    private ProfesseurRepository professeurRepository;
//
//    @Mock
//    private EvaluationEtudiantParEmployeurRepository evaluationEtudiantParEmployeurRepository;
//
//    @Mock
//    private EvaluationMilieuStageParProfesseurRepository evaluationMilieuStageParProfesseurRepository;
//
//    @BeforeEach
//    public void setupSecurityContext() {
//        Authentication auth = mock(Authentication.class);
//        List<GrantedAuthority> authorities = Collections.singletonList(
//                new SimpleGrantedAuthority("GESTIONNAIRE")
//        );
//        lenient().when(auth.getAuthorities()).thenReturn((Collection) authorities);
//
//        SecurityContext securityContext = mock(SecurityContext.class);
//        lenient().when(securityContext.getAuthentication()).thenReturn(auth);
//
//        SecurityContextHolder.setContext(securityContext);
//    }
//
//    @Test
//    public void approuveOffre_metAJourStatut() throws Exception {
//        Offre offre = new Offre();
//        offre.setId(1L);
//        offre.setStatutApprouve(Offre.StatutApprouve.ATTENTE);
//        when(offreRepository.findById(1L)).thenReturn(Optional.of(offre));
//
//        gestionnaireService.approuveOffre(1L);
//
//        assertEquals(Offre.StatutApprouve.APPROUVE, offre.getStatutApprouve());
//        verify(offreRepository).save(offre);
//    }
//
//    @Test
//    public void approuveOffre_OffreDejaVerifiee() {
//        Offre offre = new Offre();
//        offre.setId(1L);
//        offre.setStatutApprouve(Offre.StatutApprouve.APPROUVE);
//        when(offreRepository.findById(1L)).thenReturn(Optional.of(offre));
//
//        assertThrows(OffreDejaVerifieException.class, () -> gestionnaireService.approuveOffre(1L));
//    }
//
//    @Test
//    public void approuveOffre_OffreNonExistante() {
//        when(offreRepository.findById(99L)).thenReturn(Optional.empty());
//
//        assertThrows(OffreNonExistantException.class, () -> gestionnaireService.approuveOffre(99L));
//    }
//
//    @Test
//    public void refuseOffre_enregistreMessageRefus() throws Exception {
//        Offre offre = new Offre();
//        offre.setId(2L);
//        offre.setStatutApprouve(Offre.StatutApprouve.ATTENTE);
//        when(offreRepository.findById(2L)).thenReturn(Optional.of(offre));
//
//        gestionnaireService.refuseOffre(2L, "Non conforme");
//
//        assertEquals(Offre.StatutApprouve.REFUSE, offre.getStatutApprouve());
//        assertEquals("Non conforme", offre.getMessageRefus());
//        verify(offreRepository).save(offre);
//    }
//
//    @Test
//    public void refuseOffre_OffreDejaVerifiee() {
//        Offre offre = new Offre();
//        offre.setId(2L);
//        offre.setStatutApprouve(Offre.StatutApprouve.REFUSE);
//        when(offreRepository.findById(2L)).thenReturn(Optional.of(offre));
//
//        assertThrows(OffreDejaVerifieException.class, () -> gestionnaireService.refuseOffre(2L, "msg"));
//    }
//
//    @Test
//    public void refuseOffre_OffreNonExistante() {
//        when(offreRepository.findById(99L)).thenReturn(Optional.empty());
//
//        assertThrows(OffreNonExistantException.class, () -> gestionnaireService.refuseOffre(99L, "msg"));
//    }
//
//    @Test
//    public void getOffresAttente_retourneListe() throws Exception {
//        com.backend.modele.Employeur employeur = mock(com.backend.modele.Employeur.class);
//        when(employeur.getEmail()).thenReturn("employeur@test.com");
//
//        Offre offre = new Offre(
//                "Développeur java",
//                "Dev java/spring",
//                LocalDate.of(2027, 1, 16),
//                LocalDate.of(2027, 1, 17),
//                Programme.P420_B0,
//                "Montréal",
//                "25$/h",
//                LocalDate.of(2026, 9, 10),
//                employeur
//        );
//
//        when(offreRepository.findByStatutApprouve(Offre.StatutApprouve.ATTENTE)).thenReturn(asList(offre));
//
//        var result = gestionnaireService.getOffresAttente();
//
//        assertEquals(1, result.size());
//        assertEquals("employeur@test.com", result.get(0).getEmployeurDTO().getEmail());
//    }
//
//    @Test
//    public void getAllOffres_retourneToutesLesOffres() throws Exception {
//        com.backend.modele.Employeur employeur1 = mock(com.backend.modele.Employeur.class);
//        when(employeur1.getEmail()).thenReturn("employeur1@test.com");
//
//        com.backend.modele.Employeur employeur2 = mock(com.backend.modele.Employeur.class);
//        when(employeur2.getEmail()).thenReturn("employeur2@test.com");
//
//        Offre offreApprouvee = new Offre(
//                "Stage approuvé",
//                "Description stage approuvé",
//                LocalDate.of(2026, 1, 16),
//                LocalDate.of(2026, 1, 17),
//                Programme.P420_B0,
//                "Montréal",
//                "25$/h",
//                LocalDate.of(2025, 12, 10),
//                employeur1
//        );
//        offreApprouvee.setStatutApprouve(Offre.StatutApprouve.APPROUVE);
//
//        Offre offreEnAttente = new Offre(
//                "Stage en attente",
//                "Description stage en attente",
//                LocalDate.of(2026, 2, 16),
//                LocalDate.of(2026, 2, 17),
//                Programme.P420_B0,
//                "Québec",
//                "30$/h",
//                LocalDate.of(2025, 11, 15),
//                employeur2
//        );
//        offreEnAttente.setStatutApprouve(Offre.StatutApprouve.ATTENTE);
//
//        when(offreRepository.findAll()).thenReturn(asList(offreApprouvee, offreEnAttente));
//
//        var result = gestionnaireService.getAllOffres();
//
//        assertEquals(2, result.size());
//        assertEquals("employeur1@test.com", result.get(0).getEmployeurDTO().getEmail());
//        assertEquals("employeur2@test.com", result.get(1).getEmployeurDTO().getEmail());
//        assertEquals("Stage approuvé", result.get(0).getTitre());
//        assertEquals("Stage en attente", result.get(1).getTitre());
//    }
//
//    @Test
//    public void approuveOffre_AccesNonAutorise() {
//        // Simule un utilisateur sans le rôle GESTIONNAIRE
//        Authentication auth = mock(Authentication.class);
//        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
//        SecurityContext securityContext = mock(SecurityContext.class);
//        when(securityContext.getAuthentication()).thenReturn(auth);
//        SecurityContextHolder.setContext(securityContext);
//
//        assertThrows(ActionNonAutoriseeException.class, () -> gestionnaireService.approuveOffre(1L));
//    }
//
//    @Test
//    public void approuveCV_metAJourStatut() throws Exception {
//        Etudiant etudiant = mock(Etudiant.class);
//        when(etudiant.getCv()).thenReturn(new byte[]{1, 2, 3});
//        when(etudiant.getStatutCV()).thenReturn(Etudiant.StatutCV.ATTENTE);
//
//        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));
//
//        gestionnaireService.approuveCV(1L);
//
//        verify(etudiant).setStatutCV(Etudiant.StatutCV.APPROUVE);
//        verify(etudiant).setMessageRefusCV(null);
//        verify(etudiantRepository).save(etudiant);
//    }
//
//    @Test
//    public void approuveCV_CVNonExistant_etudiantInexistant() {
//        when(etudiantRepository.findById(99L)).thenReturn(Optional.empty());
//
//        assertThrows(CVNonExistantException.class, () -> gestionnaireService.approuveCV(99L));
//    }
//
//    @Test
//    public void approuveCV_CVNonExistant_cvNull() {
//        Etudiant etudiant = mock(Etudiant.class);
//        when(etudiant.getCv()).thenReturn(null);
//
//        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));
//
//        assertThrows(CVNonExistantException.class, () -> gestionnaireService.approuveCV(1L));
//    }
//
//    @Test
//    public void approuveCV_CVNonExistant_cvVide() {
//        Etudiant etudiant = mock(Etudiant.class);
//        when(etudiant.getCv()).thenReturn(new byte[0]);
//
//        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));
//
//        assertThrows(CVNonExistantException.class, () -> gestionnaireService.approuveCV(1L));
//    }
//
//    @Test
//    public void approuveCV_CVDejaVerifie_dejaApprouve() {
//        Etudiant etudiant = mock(Etudiant.class);
//        when(etudiant.getCv()).thenReturn(new byte[]{1, 2, 3});
//        when(etudiant.getStatutCV()).thenReturn(Etudiant.StatutCV.APPROUVE);
//
//        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));
//
//        assertThrows(CVDejaVerifieException.class, () -> gestionnaireService.approuveCV(1L));
//    }
//
//    @Test
//    public void approuveCV_CVDejaVerifie_dejaRefuse() {
//        Etudiant etudiant = mock(Etudiant.class);
//        when(etudiant.getCv()).thenReturn(new byte[]{1, 2, 3});
//        when(etudiant.getStatutCV()).thenReturn(Etudiant.StatutCV.REFUSE);
//
//        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));
//
//        assertThrows(CVDejaVerifieException.class, () -> gestionnaireService.approuveCV(1L));
//    }
//
//    @Test
//    public void approuveCV_AccesNonAutorise() {
//        Authentication auth = mock(Authentication.class);
//        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
//        SecurityContext securityContext = mock(SecurityContext.class);
//        when(securityContext.getAuthentication()).thenReturn(auth);
//        SecurityContextHolder.setContext(securityContext);
//
//        assertThrows(ActionNonAutoriseeException.class, () -> gestionnaireService.approuveCV(1L));
//    }
//
//// CV Refusal Tests
//
//    @Test
//    public void refuseCV_enregistreMessageRefus() throws Exception {
//        Etudiant etudiant = mock(Etudiant.class);
//        when(etudiant.getCv()).thenReturn(new byte[]{1, 2, 3});
//        when(etudiant.getStatutCV()).thenReturn(Etudiant.StatutCV.ATTENTE);
//
//        when(etudiantRepository.findById(2L)).thenReturn(Optional.of(etudiant));
//
//        gestionnaireService.refuseCV(2L, "CV non conforme");
//
//        verify(etudiant).setStatutCV(Etudiant.StatutCV.REFUSE);
//        verify(etudiant).setMessageRefusCV("CV non conforme");
//        verify(etudiantRepository).save(etudiant);
//    }
//
//    @Test
//    public void refuseCV_CVNonExistant_etudiantInexistant() {
//        when(etudiantRepository.findById(99L)).thenReturn(Optional.empty());
//
//        assertThrows(CVNonExistantException.class, () -> gestionnaireService.refuseCV(99L, "message"));
//    }
//
//    @Test
//    public void refuseCV_CVNonExistant_cvNull() {
//        Etudiant etudiant = mock(Etudiant.class);
//        when(etudiant.getCv()).thenReturn(null);
//
//        when(etudiantRepository.findById(2L)).thenReturn(Optional.of(etudiant));
//
//        assertThrows(CVNonExistantException.class, () -> gestionnaireService.refuseCV(2L, "message"));
//    }
//
//    @Test
//    public void refuseCV_CVNonExistant_cvVide() {
//        Etudiant etudiant = mock(Etudiant.class);
//        when(etudiant.getCv()).thenReturn(new byte[0]);
//
//        when(etudiantRepository.findById(2L)).thenReturn(Optional.of(etudiant));
//
//        assertThrows(CVNonExistantException.class, () -> gestionnaireService.refuseCV(2L, "message"));
//    }
//
//    @Test
//    public void refuseCV_CVDejaVerifie_dejaApprouve() {
//        Etudiant etudiant = mock(Etudiant.class);
//        when(etudiant.getCv()).thenReturn(new byte[]{1, 2, 3});
//        when(etudiant.getStatutCV()).thenReturn(Etudiant.StatutCV.APPROUVE);
//
//        when(etudiantRepository.findById(2L)).thenReturn(Optional.of(etudiant));
//
//        assertThrows(CVDejaVerifieException.class, () -> gestionnaireService.refuseCV(2L, "message"));
//    }
//
//    @Test
//    public void refuseCV_CVDejaVerifie_dejaRefuse() {
//        Etudiant etudiant = mock(Etudiant.class);
//        when(etudiant.getCv()).thenReturn(new byte[]{1, 2, 3});
//        when(etudiant.getStatutCV()).thenReturn(Etudiant.StatutCV.REFUSE);
//
//        when(etudiantRepository.findById(2L)).thenReturn(Optional.of(etudiant));
//
//        assertThrows(CVDejaVerifieException.class, () -> gestionnaireService.refuseCV(2L, "message"));
//    }
//
//    @Test
//    public void refuseCV_AccesNonAutorise() {
//        Authentication auth = mock(Authentication.class);
//        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
//        SecurityContext securityContext = mock(SecurityContext.class);
//        when(securityContext.getAuthentication()).thenReturn(auth);
//        SecurityContextHolder.setContext(securityContext);
//
//        assertThrows(ActionNonAutoriseeException.class, () -> gestionnaireService.refuseCV(2L, "message"));
//    }
//
//
//    @Test
//    public void getCVsEnAttente_retourneListe() throws Exception {
//        Etudiant etudiant1 = mock(Etudiant.class);
//        when(etudiant1.getEmail()).thenReturn("etudiant1@test.com");
//
//        Etudiant etudiant2 = mock(Etudiant.class);
//        when(etudiant2.getEmail()).thenReturn("etudiant2@test.com");
//
//        when(etudiantRepository.findAllByStatutCV(Etudiant.StatutCV.ATTENTE))
//                .thenReturn(asList(etudiant1, etudiant2));
//
//        var result = gestionnaireService.getCVsEnAttente();
//
//        assertEquals(2, result.size());
//        assertEquals("etudiant1@test.com", result.get(0).getEmail());
//        assertEquals("etudiant2@test.com", result.get(1).getEmail());
//    }
//
//    @Test
//    public void getCVsEnAttente_listeVide() throws Exception {
//        when(etudiantRepository.findAllByStatutCV(Etudiant.StatutCV.ATTENTE))
//                .thenReturn(Collections.emptyList());
//
//        var result = gestionnaireService.getCVsEnAttente();
//
//        assertTrue(result.isEmpty());
//    }
//
//    @Test
//    public void getCVsEnAttente_AccesNonAutorise() {
//        Authentication auth = mock(Authentication.class);
//        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
//        SecurityContext securityContext = mock(SecurityContext.class);
//        when(securityContext.getAuthentication()).thenReturn(auth);
//        SecurityContextHolder.setContext(securityContext);
//
//        assertThrows(ActionNonAutoriseeException.class, () -> gestionnaireService.getCVsEnAttente());
//    }
//
//
//    @Test
//    public void getAllOffres_AccesNonAutorise() {
//        Authentication auth = mock(Authentication.class);
//        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
//        SecurityContext securityContext = mock(SecurityContext.class);
//        when(securityContext.getAuthentication()).thenReturn(auth);
//        SecurityContextHolder.setContext(securityContext);
//
//        assertThrows(ActionNonAutoriseeException.class, () -> gestionnaireService.getAllOffres());
//    }
//
//    @Test
//    public void getOffresAttente_AccesNonAutorise() {
//        Authentication auth = mock(Authentication.class);
//        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
//        SecurityContext securityContext = mock(SecurityContext.class);
//        when(securityContext.getAuthentication()).thenReturn(auth);
//        SecurityContextHolder.setContext(securityContext);
//
//        assertThrows(ActionNonAutoriseeException.class, () -> gestionnaireService.getOffresAttente());
//    }
//
//    @Test
//    public void getCandidaturesEligiblesEntente_retourneListe() throws Exception {
//        com.backend.modele.Employeur emp1 = mock(com.backend.modele.Employeur.class);
//        lenient().when(emp1.getContact()).thenReturn("contact1");
//        lenient().when(emp1.getEmail()).thenReturn("emp1@test.com");
//
//        com.backend.modele.Employeur emp2 = mock(com.backend.modele.Employeur.class);
//        lenient().when(emp2.getContact()).thenReturn("contact2");
//        lenient().when(emp2.getEmail()).thenReturn("emp2@test.com");
//
//        Offre offre1 = new Offre();
//        offre1.setId(101L);
//        offre1.setEmployeur(emp1);
//
//        Offre offre2 = new Offre();
//        offre2.setId(102L);
//        offre2.setEmployeur(emp2);
//
//        Etudiant etu1 = mock(Etudiant.class);
//        when(etu1.getId()).thenReturn(5L);
//        when(etu1.getEmail()).thenReturn("etu1@test.com");
//
//        Etudiant etu2 = mock(Etudiant.class);
//        when(etu2.getId()).thenReturn(6L);
//        when(etu2.getEmail()).thenReturn("etu2@test.com");
//
//        Candidature c1 = new Candidature();
//        c1.setOffre(offre1);
//        c1.setEtudiant(etu1);
//        c1.setStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT);
//
//        Candidature c2 = new Candidature();
//        c2.setOffre(offre2);
//        c2.setEtudiant(etu2);
//        c2.setStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT);
//
//        when(candidatureRepository.findByStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT))
//                .thenReturn(asList(c1, c2));
//
//        var result = gestionnaireService.getCandidaturesEligiblesEntente();
//        assertEquals(2, result.size());
//    }
//    @Test
//    public void getCandidaturesEligiblesEntente_etudiantNull_lanceNPE() {
//        // Offre valide avec employeur mocké
//        com.backend.modele.Employeur emp = mock(com.backend.modele.Employeur.class);
//        lenient().when(emp.getContact()).thenReturn("contact");
//        Offre offre = new Offre();
//        offre.setId(201L);
//        offre.setEmployeur(emp);
//
//        // Candidature sans étudiant -> toDTO() provoquera NPE
//        Candidature c = new Candidature();
//        c.setOffre(offre);
//        c.setEtudiant(null);
//        c.setStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT);
//
//        when(candidatureRepository.findByStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT))
//                .thenReturn(asList(c));
//
//        assertThrows(NullPointerException.class, () -> gestionnaireService.getCandidaturesEligiblesEntente());
//    }
//
//    @Test
//    public void getCandidaturesEligiblesEntente_offreSansEmployeur_lanceNPE() {
//        // Offre sans employeur
//        Offre offreSansEmp = new Offre();
//        offreSansEmp.setId(202L);
//        offreSansEmp.setEmployeur(null);
//
//        // Etudiant mocké valide (stubbings rendus lenient pour éviter UnnecessaryStubbingException)
//        Etudiant etu = mock(Etudiant.class);
//        lenient().when(etu.getId()).thenReturn(10L);
//        lenient().when(etu.getEmail()).thenReturn("badcase@test.com");
//
//        // Candidature avec offre sans employeur -> toDTO() provoquera NPE
//        Candidature c = new Candidature();
//        c.setOffre(offreSansEmp);
//        c.setEtudiant(etu);
//        c.setStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT);
//
//        when(candidatureRepository.findByStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT))
//                .thenReturn(asList(c));
//
//        assertThrows(NullPointerException.class, () -> gestionnaireService.getCandidaturesEligiblesEntente());
//    }
//
//
//    @Test
//    public void creerEntente_creeEtSauvegarde() throws Exception {
//        Employeur employeur = new Employeur();
//        employeur.setEmail("emp@test.com");
//
//        Offre offre = new Offre();
//        offre.setId(10L);
//        offre.setTitre("Titre Offre");
//        offre.setEmployeur(employeur);
//
//        when(offreRepository.findById(10L)).thenReturn(Optional.of(offre));
//
//        Etudiant etudiant = new Etudiant();
//        etudiant.setEmail("etu@test.com");
//
//        when(etudiantRepository.findById(5L)).thenReturn(Optional.of(etudiant));
//
//        Candidature candidature = new Candidature();
//        candidature.setId(7L);
//        candidature.setEtudiant(etudiant);
//        candidature.setOffre(offre);
//        candidature.setStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT);
//
//        when(candidatureRepository.findByEtudiantAndOffre(etudiant, offre)).thenReturn(Optional.of(candidature));
//        when(ententeStageRepository.existsByEtudiantAndOffreAndArchivedFalse(etudiant, offre)).thenReturn(false);
//
//        EntenteStageDTO dto = new EntenteStageDTO();
//        dto.setOffreId(10L);
//        dto.setEtudiantId(5L);
//        dto.setTitre("Entente X");
//        dto.setDescription("Desc");
//        dto.setDateDebut(LocalDate.now());
//        dto.setDateFin(LocalDate.now().plusMonths(3));
//
//        gestionnaireService.creerEntente(dto);
//
//        verify(ententeStageRepository, atLeastOnce()).save(any(EntenteStage.class));
//    }
//
//    @Test
//    public void creerEntente_offreNonExistante_lance() throws Exception {
//        EntenteStageDTO dto = new EntenteStageDTO();
//        dto.setOffreId(99L);
//        dto.setEtudiantId(1L);
//
//        when(offreRepository.findById(99L)).thenReturn(Optional.empty());
//
//        assertThrows(OffreNonExistantException.class, () -> gestionnaireService.creerEntente(dto));
//    }
//
//    @Test
//    public void creerEntente_ententeExistante_lance() throws Exception {
//        Employeur employeur = new Employeur();
//        Offre offre = new Offre();
//        offre.setId(11L);
//        offre.setEmployeur(employeur);
//
//        Etudiant etudiant = new Etudiant();
//
//        when(offreRepository.findById(11L)).thenReturn(Optional.of(offre));
//        when(etudiantRepository.findById(6L)).thenReturn(Optional.of(etudiant));
//        when(ententeStageRepository.existsByEtudiantAndOffreAndArchivedFalse(etudiant, offre)).thenReturn(true);
//
//        EntenteStageDTO dto = new EntenteStageDTO();
//        dto.setOffreId(11L);
//        dto.setEtudiantId(6L);
//
//        assertThrows(com.backend.Exceptions.EntenteDejaExistanteException.class, () -> gestionnaireService.creerEntente(dto));
//    }
//
//    @Test
//    public void modifierEntente_modifieEtSauvegarde() throws Exception {
//        Etudiant etu = new Etudiant();
//        Employeur emp = new Employeur();
//        Offre offre = new Offre();
//
//        EntenteStage entente = new EntenteStage();
//        entente.setId(20L);
//        entente.setEtudiant(etu);
//        entente.setEmployeur(emp);
//        entente.setOffre(offre);
//        entente.setStatut(EntenteStage.StatutEntente.EN_ATTENTE);
//
//        when(ententeStageRepository.findById(20L)).thenReturn(Optional.of(entente));
//
//        EntenteStageDTO dto = new EntenteStageDTO();
//        dto.setTitre("NouveauTitre");
//        dto.setDescription("NouvelleDesc");
//        dto.setDateDebut(LocalDate.now());
//        dto.setDateFin(LocalDate.now().plusDays(10));
//
//        gestionnaireService.modifierEntente(20L, dto);
//
//        verify(ententeStageRepository, atLeastOnce()).save(entente);
//        assertEquals("NouveauTitre", entente.getTitre());
//    }
//
//    @Test
//    public void modifierEntente_ententeNonTrouvee_lance() {
//        when(ententeStageRepository.findById(999L)).thenReturn(Optional.empty());
//        EntenteStageDTO dto = new EntenteStageDTO();
//        assertThrows(EntenteNonTrouveException.class, () -> gestionnaireService.modifierEntente(999L, dto));
//    }
//
//    @Test
//    public void modifierEntente_statutNonModifiable_lance() {
//        EntenteStage entente = new EntenteStage();
//        entente.setId(21L);
//        entente.setStatut(EntenteStage.StatutEntente.SIGNEE);
//        when(ententeStageRepository.findById(21L)).thenReturn(Optional.of(entente));
//        EntenteStageDTO dto = new EntenteStageDTO();
//        assertThrows(EntenteModificationNonAutoriseeException.class, () -> gestionnaireService.modifierEntente(21L, dto));
//    }
//
//    @Test
//    public void annulerEntente_archiveEtNotifie() throws Exception {
//        Etudiant etu = new Etudiant();
//        Employeur emp = new Employeur();
//        EntenteStage entente = new EntenteStage();
//        entente.setId(30L);
//        entente.setEtudiant(etu);
//        entente.setEmployeur(emp);
//        entente.setStatut(EntenteStage.StatutEntente.EN_ATTENTE);
//
//        when(ententeStageRepository.findById(30L)).thenReturn(Optional.of(entente));
//
//        gestionnaireService.annulerEntente(30L);
//
//        verify(ententeStageRepository).save(entente);
//        assertTrue(entente.isArchived());
//        assertEquals(EntenteStage.StatutEntente.ANNULEE, entente.getStatut());
//    }
//
//    @Test
//    public void annulerEntente_ententeNonTrouvee_lance() {
//        when(ententeStageRepository.findById(404L)).thenReturn(Optional.empty());
//        assertThrows(EntenteNonTrouveException.class, () -> gestionnaireService.annulerEntente(404L));
//    }
//
//    @Test
//    public void getEntentesActives_retourneListe() throws Exception {
//        Employeur employeur = mock(Employeur.class);
//        EntenteStage e1 = new EntenteStage();
//        e1.setEmployeur(employeur);
//        Etudiant etu1 = mock(Etudiant.class);
//        e1.setEtudiant(etu1);
//        when(etu1.getId()).thenReturn(1L);
//        e1.setId(1L);
//        EntenteStage e2 = new EntenteStage();
//        e2.setEmployeur(employeur);
//        Etudiant etu2 = mock(Etudiant.class);
//        when(etu2.getId()).thenReturn(2L);
//        e2.setEtudiant(etu2);
//        e2.setId(2L);
//
//
//        when(ententeStageRepository.findByArchivedFalse()).thenReturn(asList(e1, e2));
//
//        var result = gestionnaireService.getEntentesActives();
//        assertEquals(2, result.size());
//    }
//
//    @Test
//    public void getEntenteById_retourneDTO() throws Exception {
//        EntenteStage e = new EntenteStage();
//        Employeur employeur = mock(Employeur.class);
//        e.setEmployeur(employeur);
//        Etudiant etudiant = mock(Etudiant.class);
//        e.setEtudiant(etudiant);
//        e.setId(55L);
//        when(ententeStageRepository.findById(55L)).thenReturn(Optional.of(e));
//
//        var dto = gestionnaireService.getEntenteById(55L);
//        assertEquals(55L, dto.getId());
//    }
//
//    @Test
//    public void getEntenteDocument_retourneBytes_siPresent() throws Exception {
//        EntenteStage e = new EntenteStage();
//        e.setId(66L);
//        e.setPdfBase64(Base64.getEncoder().encodeToString(new byte[]{1,2,3}));
//        when(ententeStageRepository.findById(66L)).thenReturn(Optional.of(e));
//
//        byte[] doc = gestionnaireService.getEntenteDocument(66L);
//        assertArrayEquals(new byte[]{1,2,3}, doc);
//    }
//
//    @Test
//    public void getEntenteDocument_absent_lance() throws Exception {
//        EntenteStage e = new EntenteStage();
//        e.setId(67L);
//        e.setPdfBase64(null);
//        when(ententeStageRepository.findById(67L)).thenReturn(Optional.of(e));
//
//        assertThrows(EntenteDocumentNonTrouveeException.class, () -> gestionnaireService.getEntenteDocument(67L));
//    }
//
//    @Test
//    public void setEtudiantAProfesseur_assigneEtSauvegarde() throws Exception {
//        Professeur professeur = mock(Professeur.class);
//        lenient().when(professeur.getId()).thenReturn(10L);
//        lenient().when(professeur.getNom()).thenReturn("Dupont");
//        lenient().when(professeur.getPrenom()).thenReturn("Pierre");
//        lenient().when(professeur.getEmail()).thenReturn("pierre.dupont@college.com");
//
//        Etudiant etudiant = mock(Etudiant.class);
//        lenient().when(etudiant.getId()).thenReturn(5L);
//        lenient().when(etudiant.getNom()).thenReturn("Martin");
//        lenient().when(etudiant.getPrenom()).thenReturn("Sophie");
//        lenient().when(etudiant.getEmail()).thenReturn("sophie.martin@student.com");
//
//        when(professeurRepository.findById(10L)).thenReturn(Optional.of(professeur));
//        when(etudiantRepository.findById(5L)).thenReturn(Optional.of(etudiant));
//
//        gestionnaireService.setEtudiantAProfesseur(10L, 5L);
//
//        verify(etudiant).setProfesseur(professeur);
//        verify(etudiantRepository).save(etudiant);
//    }
//
//    @Test
//    public void setEtudiantAProfesseur_professeurNonTrouve_lance() {
//        Etudiant etudiant = mock(Etudiant.class);
//
//        when(professeurRepository.findById(99L)).thenReturn(Optional.empty());
//        lenient().when(etudiantRepository.findById(5L)).thenReturn(Optional.of(etudiant));
//
//        assertThrows(UtilisateurPasTrouveException.class,
//                () -> gestionnaireService.setEtudiantAProfesseur(99L, 5L));
//
//        verify(etudiantRepository, never()).save(any());
//    }
//
//    @Test
//    public void setEtudiantAProfesseur_etudiantNonTrouve_lance() {
//        Professeur professeur = mock(Professeur.class);
//
//        when(professeurRepository.findById(10L)).thenReturn(Optional.of(professeur));
//        when(etudiantRepository.findById(99L)).thenReturn(Optional.empty());
//
//        assertThrows(UtilisateurPasTrouveException.class,
//                () -> gestionnaireService.setEtudiantAProfesseur(10L, 99L));
//
//        verify(etudiantRepository, never()).save(any());
//    }
//
//    @Test
//    public void setEtudiantAProfesseur_accesNonAutorise() {
//        Authentication auth = mock(Authentication.class);
//        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
//        SecurityContext securityContext = mock(SecurityContext.class);
//        when(securityContext.getAuthentication()).thenReturn(auth);
//        SecurityContextHolder.setContext(securityContext);
//
//        assertThrows(ActionNonAutoriseeException.class,
//                () -> gestionnaireService.setEtudiantAProfesseur(10L, 5L));
//    }
//
//    @Test
//    public void setEtudiantAProfesseur_changeAssignation() throws Exception {
//        Professeur ancienProf = mock(Professeur.class);
//        lenient().when(ancienProf.getId()).thenReturn(8L);
//
//        Professeur nouveauProf = mock(Professeur.class);
//        lenient().when(nouveauProf.getId()).thenReturn(10L);
//
//        Etudiant etudiant = mock(Etudiant.class);
//        lenient().when(etudiant.getId()).thenReturn(5L);
//
//        when(professeurRepository.findById(10L)).thenReturn(Optional.of(nouveauProf));
//        when(etudiantRepository.findById(5L)).thenReturn(Optional.of(etudiant));
//
//        gestionnaireService.setEtudiantAProfesseur(10L, 5L);
//
//        verify(etudiant).setProfesseur(nouveauProf);
//        verify(etudiantRepository).save(etudiant);
//    }
//
//// ========== Tests pour getAllEtudiants ==========
//
//    @Test
//    public void getAllEtudiants_retourneListeComplete() throws Exception {
//        Etudiant etu1 = mock(Etudiant.class);
//        when(etu1.getEmail()).thenReturn("sophie.martin@student.com");
//        when(etu1.getNom()).thenReturn("Martin");
//        when(etu1.getPrenom()).thenReturn("Sophie");
//        when(etu1.getTelephone()).thenReturn("514-123-4567");
//
//        Etudiant etu2 = mock(Etudiant.class);
//        when(etu2.getEmail()).thenReturn("jean.tremblay@student.com");
//        when(etu2.getNom()).thenReturn("Tremblay");
//        when(etu2.getPrenom()).thenReturn("Jean");
//        when(etu2.getTelephone()).thenReturn("514-987-6543");
//
//        Etudiant etu3 = mock(Etudiant.class);
//        when(etu3.getEmail()).thenReturn("marie.gagnon@student.com");
//        when(etu3.getNom()).thenReturn("Gagnon");
//        when(etu3.getPrenom()).thenReturn("Marie");
//        when(etu3.getTelephone()).thenReturn("438-555-1234");
//
//        when(etudiantRepository.findAll()).thenReturn(asList(etu1, etu2, etu3));
//
//        var result = gestionnaireService.getAllEtudiants();
//
//        assertEquals(3, result.size());
//        assertEquals("sophie.martin@student.com", result.get(0).getEmail());
//        assertEquals("jean.tremblay@student.com", result.get(1).getEmail());
//        assertEquals("marie.gagnon@student.com", result.get(2).getEmail());
//    }
//
//    @Test
//    public void getAllEtudiants_listeVide() throws Exception {
//        when(etudiantRepository.findAll()).thenReturn(Collections.emptyList());
//
//        var result = gestionnaireService.getAllEtudiants();
//
//        assertTrue(result.isEmpty());
//    }
//
//    @Test
//    public void getAllEtudiants_accesNonAutorise() {
//        Authentication auth = mock(Authentication.class);
//        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
//        SecurityContext securityContext = mock(SecurityContext.class);
//        when(securityContext.getAuthentication()).thenReturn(auth);
//        SecurityContextHolder.setContext(securityContext);
//
//        assertThrows(ActionNonAutoriseeException.class,
//                () -> gestionnaireService.getAllEtudiants());
//    }
//
//    @Test
//    public void getAllEtudiants_avecProfesseurAssigne() throws Exception {
//        Professeur prof = mock(Professeur.class);
//        lenient().when(prof.getId()).thenReturn(10L);
//        lenient().when(prof.getNom()).thenReturn("Dupont");
//        lenient().when(prof.getPrenom()).thenReturn("Pierre");
//        lenient().when(prof.getEmail()).thenReturn("pierre.dupont@college.com");
//        lenient().when(prof.getTelephone()).thenReturn("514-111-2222");
//
//        Etudiant etu = mock(Etudiant.class);
//        when(etu.getEmail()).thenReturn("etudiant@test.com");
//        when(etu.getNom()).thenReturn("Test");
//        when(etu.getPrenom()).thenReturn("Etudiant");
//        when(etu.getTelephone()).thenReturn("514-999-8888");
//        when(etu.getProfesseur()).thenReturn(prof);
//
//        when(etudiantRepository.findAll()).thenReturn(asList(etu));
//
//        var result = gestionnaireService.getAllEtudiants();
//
//        assertEquals(1, result.size());
//        assertNotNull(result.get(0).getProfesseur());
//        assertEquals("pierre.dupont@college.com", result.get(0).getProfesseur().getEmail());
//    }
//
//// ========== Tests pour getAllProfesseurs ==========
//
//    @Test
//    public void getAllProfesseurs_retourneListeComplete() throws Exception {
//        Professeur prof1 = mock(Professeur.class);
//        when(prof1.getId()).thenReturn(1L);
//        when(prof1.getEmail()).thenReturn("pierre.dupont@college.com");
//        when(prof1.getNom()).thenReturn("Dupont");
//        when(prof1.getPrenom()).thenReturn("Pierre");
//        when(prof1.getTelephone()).thenReturn("514-111-1111");
//
//        Professeur prof2 = mock(Professeur.class);
//        when(prof2.getId()).thenReturn(2L);
//        when(prof2.getEmail()).thenReturn("marie.labelle@college.com");
//        when(prof2.getNom()).thenReturn("Labelle");
//        when(prof2.getPrenom()).thenReturn("Marie");
//        when(prof2.getTelephone()).thenReturn("514-222-2222");
//
//        when(professeurRepository.findAll()).thenReturn(asList(prof1, prof2));
//
//        var result = gestionnaireService.getAllProfesseurs();
//
//        assertEquals(2, result.size());
//        assertEquals("pierre.dupont@college.com", result.get(0).getEmail());
//        assertEquals("marie.labelle@college.com", result.get(1).getEmail());
//    }
//
//    @Test
//    public void getAllProfesseurs_listeVide() throws Exception {
//        when(professeurRepository.findAll()).thenReturn(Collections.emptyList());
//
//        var result = gestionnaireService.getAllProfesseurs();
//
//        assertTrue(result.isEmpty());
//    }
//
//    @Test
//    public void getAllProfesseurs_accesNonAutorise() {
//        Authentication auth = mock(Authentication.class);
//        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
//        SecurityContext securityContext = mock(SecurityContext.class);
//        when(securityContext.getAuthentication()).thenReturn(auth);
//        SecurityContextHolder.setContext(securityContext);
//
//        assertThrows(ActionNonAutoriseeException.class,
//                () -> gestionnaireService.getAllProfesseurs());
//    }
//
//    @Test
//    public void getAllProfesseurs_unSeulProfesseur() throws Exception {
//        Professeur prof = mock(Professeur.class);
//        when(prof.getId()).thenReturn(5L);
//        when(prof.getEmail()).thenReturn("unique@college.com");
//        when(prof.getNom()).thenReturn("Unique");
//        when(prof.getPrenom()).thenReturn("Professeur");
//        when(prof.getTelephone()).thenReturn("514-555-5555");
//
//        when(professeurRepository.findAll()).thenReturn(asList(prof));
//
//        var result = gestionnaireService.getAllProfesseurs();
//
//        assertEquals(1, result.size());
//        assertEquals("unique@college.com", result.get(0).getEmail());
//        assertEquals("Unique", result.get(0).getNom());
//        assertEquals("Professeur", result.get(0).getPrenom());
//    }
//
//    // ===== New service tests: signerEntente, refuserEntente, getEntentesEnAttente =====
//
//    @Test
//    public void signerEntente_succes_modifieStatutEtDate() throws Exception {
//        EntenteStage entente = new EntenteStage();
//        entente.setId(42L);
//        entente.setEtudiantSignature(EntenteStage.SignatureStatus.SIGNEE);
//        entente.setEmployeurSignature(EntenteStage.SignatureStatus.SIGNEE);
//        entente.setStatut(EntenteStage.StatutEntente.EN_ATTENTE);
//
//        when(ententeStageRepository.findById(42L)).thenReturn(Optional.of(entente));
//
//        gestionnaireService.signerEntente(42L);
//
//        assertEquals(EntenteStage.StatutEntente.SIGNEE, entente.getStatut());
//        assertNotNull(entente.getDateSignatureGestionnaire());
//        verify(ententeStageRepository).save(entente);
//    }
//
//    @Test
//    public void signerEntente_signaturesManquantes_lanceStatutInvalide() {
//        EntenteStage entente = new EntenteStage();
//        entente.setId(7L);
//        entente.setEtudiantSignature(EntenteStage.SignatureStatus.EN_ATTENTE);
//        entente.setEmployeurSignature(EntenteStage.SignatureStatus.SIGNEE);
//        entente.setStatut(EntenteStage.StatutEntente.EN_ATTENTE);
//
//        when(ententeStageRepository.findById(7L)).thenReturn(Optional.of(entente));
//
//        assertThrows(StatutEntenteInvalideException.class, () -> gestionnaireService.signerEntente(7L));
//    }
//
//    @Test
//    public void signerEntente_dejaSignee_lanceStatutInvalide() {
//        EntenteStage entente = new EntenteStage();
//        entente.setId(8L);
//        entente.setEtudiantSignature(EntenteStage.SignatureStatus.SIGNEE);
//        entente.setEmployeurSignature(EntenteStage.SignatureStatus.SIGNEE);
//        entente.setStatut(EntenteStage.StatutEntente.SIGNEE);
//
//        when(ententeStageRepository.findById(8L)).thenReturn(Optional.of(entente));
//
//        assertThrows(StatutEntenteInvalideException.class, () -> gestionnaireService.signerEntente(8L));
//    }
//
//    @Test
//    public void signerEntente_ententeNonTrouvee_lance() {
//        when(ententeStageRepository.findById(404L)).thenReturn(Optional.empty());
//        assertThrows(EntenteNonTrouveException.class, () -> gestionnaireService.signerEntente(404L));
//    }
//
//    @Test
//    public void signerEntente_accesNonAutorise() {
//        Authentication auth = mock(Authentication.class);
//        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
//        SecurityContext securityContext = mock(SecurityContext.class);
//        when(securityContext.getAuthentication()).thenReturn(auth);
//        SecurityContextHolder.setContext(securityContext);
//
//        assertThrows(ActionNonAutoriseeException.class, () -> gestionnaireService.signerEntente(1L));
//    }
//
//    @Test
//    public void refuserEntente_succes_archive() throws Exception {
//        EntenteStage entente = new EntenteStage();
//        entente.setId(50L);
//        entente.setStatut(EntenteStage.StatutEntente.EN_ATTENTE);
//
//        when(ententeStageRepository.findById(50L)).thenReturn(Optional.of(entente));
//
//        gestionnaireService.refuserEntente(50L);
//
//        assertEquals(EntenteStage.StatutEntente.ANNULEE, entente.getStatut());
//        assertTrue(entente.isArchived());
//        verify(ententeStageRepository).save(entente);
//    }
//
//    @Test
//    public void refuserEntente_ententeNonTrouvee_lance() {
//        when(ententeStageRepository.findById(404L)).thenReturn(Optional.empty());
//        assertThrows(EntenteNonTrouveException.class, () -> gestionnaireService.refuserEntente(404L));
//    }
//
//    @Test
//    public void refuserEntente_statutInvalide_dejaSignee() {
//        EntenteStage entente = new EntenteStage();
//        entente.setId(51L);
//        entente.setStatut(EntenteStage.StatutEntente.SIGNEE);
//        when(ententeStageRepository.findById(51L)).thenReturn(Optional.of(entente));
//
//        assertThrows(StatutEntenteInvalideException.class, () -> gestionnaireService.refuserEntente(51L));
//    }
//
//    @Test
//    public void refuserEntente_accesNonAutorise() {
//        Authentication auth = mock(Authentication.class);
//        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
//        SecurityContext securityContext = mock(SecurityContext.class);
//        when(securityContext.getAuthentication()).thenReturn(auth);
//        SecurityContextHolder.setContext(securityContext);
//
//        assertThrows(ActionNonAutoriseeException.class, () -> gestionnaireService.refuserEntente(1L));
//    }
//
//    @Test
//    public void getEntentesEnAttente_filtreCorrectement() throws Exception {
//        EntenteStage e1 = new EntenteStage();
//        e1.setId(1L);
//        e1.setEtudiantSignature(EntenteStage.SignatureStatus.SIGNEE);
//        e1.setEmployeurSignature(EntenteStage.SignatureStatus.SIGNEE);
//        e1.setStatut(EntenteStage.StatutEntente.EN_ATTENTE);
//
//        Etudiant etu = mock(Etudiant.class);
//        when(etu.getId()).thenReturn(100L);
//        e1.setEtudiant(etu);
//        Employeur emp = mock(Employeur.class);
//        e1.setEmployeur(emp);
//
//        EntenteStage e2 = new EntenteStage();
//        e2.setId(2L);
//        e2.setEtudiantSignature(EntenteStage.SignatureStatus.EN_ATTENTE);
//        e2.setEmployeurSignature(EntenteStage.SignatureStatus.SIGNEE);
//        e2.setStatut(EntenteStage.StatutEntente.EN_ATTENTE);
//
//        EntenteStage e3 = new EntenteStage();
//        e3.setId(3L);
//        e3.setEtudiantSignature(EntenteStage.SignatureStatus.SIGNEE);
//        e3.setEmployeurSignature(EntenteStage.SignatureStatus.SIGNEE);
//        e3.setStatut(EntenteStage.StatutEntente.SIGNEE);
//
//        when(ententeStageRepository.findByArchivedFalse()).thenReturn(asList(e1, e2, e3));
//
//        var result = gestionnaireService.getEntentesEnAttente();
//        assertEquals(1, result.size());
//        assertEquals(1L, result.get(0).getId());
//    }
//
//    @Test
//    public void getEntentesEnAttente_accesNonAutorise() {
//        Authentication auth = mock(Authentication.class);
//        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
//        SecurityContext securityContext = mock(SecurityContext.class);
//        when(securityContext.getAuthentication()).thenReturn(auth);
//        SecurityContextHolder.setContext(securityContext);
//
//        assertThrows(ActionNonAutoriseeException.class, () -> gestionnaireService.getEntentesEnAttente());
//    }
//
//    @Test
//    public void getDocumentsEntente_tousDocuments_present() throws Exception {
//        EntenteStage entente = new EntenteStage();
//        entente.setId(100L);
//        entente.setPdfBase64(Base64.getEncoder().encodeToString("contract".getBytes()));
//        when(ententeStageRepository.findById(100L)).thenReturn(Optional.of(entente));
//
//        EvaluationEtudiantParEmployeur evalEmp = new EvaluationEtudiantParEmployeur();
//        evalEmp.setEntente(entente);
//        evalEmp.setPdfBase64(Base64.getEncoder().encodeToString("evalEmp".getBytes()));
//        when(evaluationEtudiantParEmployeurRepository.findAll()).thenReturn(asList(evalEmp));
//
//        EvaluationMilieuStage evalProf = new EvaluationMilieuStage();
//        evalProf.setEntente(entente);
//        evalProf.setPdfBase64(Base64.getEncoder().encodeToString("evalProf".getBytes()));
//        when(evaluationMilieuStageParProfesseurRepository.findAll()).thenReturn(asList(evalProf));
//
//        com.backend.service.DTO.DocumentsEntenteDTO dto = gestionnaireService.getDocumentsEntente(100L);
//        assertNotNull(dto);
//        assertArrayEquals("contract".getBytes(), dto.getContractEntentepdf());
//        assertArrayEquals("evalEmp".getBytes(), dto.getEvaluationStagiairepdf());
//        assertArrayEquals("evalProf".getBytes(), dto.getEvaluationMilieuStagepdf());
//    }
//
//    @Test
//    public void getDocumentsEntente_seulContrat_present() throws Exception {
//        EntenteStage entente = new EntenteStage();
//        entente.setId(101L);
//        entente.setPdfBase64(Base64.getEncoder().encodeToString("contract".getBytes()));
//        when(ententeStageRepository.findById(101L)).thenReturn(Optional.of(entente));
//
//        when(evaluationEtudiantParEmployeurRepository.findAll()).thenReturn(Collections.emptyList());
//        when(evaluationMilieuStageParProfesseurRepository.findAll()).thenReturn(Collections.emptyList());
//
//        com.backend.service.DTO.DocumentsEntenteDTO dto = gestionnaireService.getDocumentsEntente(101L);
//        assertNotNull(dto);
//        assertArrayEquals("contract".getBytes(), dto.getContractEntentepdf());
//        assertNull(dto.getEvaluationStagiairepdf());
//        assertNull(dto.getEvaluationMilieuStagepdf());
//    }
//
//    @Test
//    public void getDocumentsEntente_evalEmployeurSeul_present() throws Exception {
//        EntenteStage entente = new EntenteStage();
//        entente.setId(102L);
//        when(ententeStageRepository.findById(102L)).thenReturn(Optional.of(entente));
//
//        EvaluationEtudiantParEmployeur evalEmp = new EvaluationEtudiantParEmployeur();
//        evalEmp.setEntente(entente);
//        evalEmp.setPdfBase64(Base64.getEncoder().encodeToString("evalEmp".getBytes()));
//        when(evaluationEtudiantParEmployeurRepository.findAll()).thenReturn(asList(evalEmp));
//
//        when(evaluationMilieuStageParProfesseurRepository.findAll()).thenReturn(Collections.emptyList());
//
//        com.backend.service.DTO.DocumentsEntenteDTO dto = gestionnaireService.getDocumentsEntente(102L);
//        assertNotNull(dto);
//        assertNull(dto.getContractEntentepdf());
//        assertArrayEquals("evalEmp".getBytes(), dto.getEvaluationStagiairepdf());
//        assertNull(dto.getEvaluationMilieuStagepdf());
//    }
//
//    @Test
//    public void getDocumentsEntente_aucunDocument_retourneNull() throws Exception {
//        EntenteStage entente = new EntenteStage();
//        entente.setId(103L);
//        when(ententeStageRepository.findById(103L)).thenReturn(Optional.of(entente));
//
//        when(evaluationEtudiantParEmployeurRepository.findAll()).thenReturn(Collections.emptyList());
//        when(evaluationMilieuStageParProfesseurRepository.findAll()).thenReturn(Collections.emptyList());
//
//        com.backend.service.DTO.DocumentsEntenteDTO dto = gestionnaireService.getDocumentsEntente(103L);
//        assertNull(dto);
//    }
//
//    @Test
//    public void getDocumentsEntente_base64Invalide_estIgnore() throws Exception {
//        EntenteStage entente = new EntenteStage();
//        entente.setId(104L);
//        entente.setPdfBase64("not-base64");
//        when(ententeStageRepository.findById(104L)).thenReturn(Optional.of(entente));
//
//        when(evaluationEtudiantParEmployeurRepository.findAll()).thenReturn(Collections.emptyList());
//        when(evaluationMilieuStageParProfesseurRepository.findAll()).thenReturn(Collections.emptyList());
//
//        com.backend.service.DTO.DocumentsEntenteDTO dto = gestionnaireService.getDocumentsEntente(104L);
//        assertNull(dto);
//    }
//
//    @Test
//    public void getDocumentsEntente_findAllThrows_exceptionIsIgnored() throws Exception {
//        EntenteStage entente = new EntenteStage();
//        entente.setId(105L);
//        entente.setPdfBase64(Base64.getEncoder().encodeToString("contract".getBytes()));
//        when(ententeStageRepository.findById(105L)).thenReturn(Optional.of(entente));
//
//        when(evaluationEtudiantParEmployeurRepository.findAll()).thenThrow(new RuntimeException("db error"));
//        when(evaluationMilieuStageParProfesseurRepository.findAll()).thenThrow(new RuntimeException("db error2"));
//
//        com.backend.service.DTO.DocumentsEntenteDTO dto = gestionnaireService.getDocumentsEntente(105L);
//        assertNotNull(dto);
//        assertArrayEquals("contract".getBytes(), dto.getContractEntentepdf());
//    }
//
//    @Test
//    public void getDocumentsEntente_ententeNonTrouvee_lance() {
//        when(ententeStageRepository.findById(999L)).thenReturn(Optional.empty());
//        assertThrows(EntenteNonTrouveException.class, () -> gestionnaireService.getDocumentsEntente(999L));
//    }
//
//    @Test
//    public void getDocumentsEntente_accesNonAutorise() {
//        Authentication auth = mock(Authentication.class);
//        when(auth.getAuthorities()).thenReturn(Collections.emptyList());
//        SecurityContext securityContext = mock(SecurityContext.class);
//        when(securityContext.getAuthentication()).thenReturn(auth);
//        SecurityContextHolder.setContext(securityContext);
//
//        assertThrows(ActionNonAutoriseeException.class, () -> gestionnaireService.getDocumentsEntente(1L));
//    }
//
//}
