package com.backend.service;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.OffreDejaVerifieException;
import com.backend.Exceptions.OffreNonExistantException;
import com.backend.modele.Offre;
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

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GestionnaireServiceTest {

    @Mock
    private OffreRepository offreRepository;

    @InjectMocks
    private GestionnaireService gestionnaireService;

    @BeforeEach
    public void setupSecurityContext() {
        Authentication auth = mock(Authentication.class);
        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("GESTIONNAIRE")
        );
        when(auth.getAuthorities()).thenReturn((Collection) authorities);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);

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
        Offre offre = new Offre();
        offre.setStatutApprouve(Offre.StatutApprouve.ATTENTE);
        when(offreRepository.findByStatutApprouve(Offre.StatutApprouve.ATTENTE)).thenReturn(Arrays.asList(offre));

        var result = gestionnaireService.getOffresAttente();

        assertEquals(1, result.size());
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
}
