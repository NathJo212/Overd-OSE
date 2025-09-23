package com.backend.service;

import com.backend.modele.Offre;
import com.backend.persistence.OffreRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GestionnaireServiceTest {

    @Mock
    private OffreRepository offreRepository;

    @InjectMocks
    private GestionnaireService gestionnaireService;

    @Test
    public void testApprouveOffre() {
        // Arrange
        Offre offre = new Offre();
        offre.setApprouve(false);

        // Act
        gestionnaireService.approuveOffre(offre);

        // Assert
        assert(offre.isApprouve());
        verify(offreRepository, times(1)).save(any(Offre.class));
    }

    @Test
    public void testRefuseOffre() {
        // Arrange
        Offre offre = new Offre();
        offre.setApprouve(true);

        // Act
        gestionnaireService.refuseOffre(offre);

        // Assert
        assert(!offre.isApprouve());
        verify(offreRepository, times(1)).save(any(Offre.class));
    }
}
