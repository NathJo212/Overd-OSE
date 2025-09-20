package com.backend.service;

import com.backend.Exceptions.InvalidMotPasseException;
import com.backend.modele.Employeur;
import com.backend.persistence.EmployeurRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmployeurServiceTest {
    @Mock
    private EmployeurRepository employeurRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private EmployeurService employeurService;

    @Test
    public void testCreationEmployeur() throws InvalidMotPasseException {
        // Arrange
        Employeur employeur = new Employeur("mon@employeur.com","Etudiant12?","(514) 582-9898","Gogole","Jaques L'heureux");
        when(employeurRepository.existsByEmail(employeur.getEmail())).thenReturn(false);
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
        when(employeurRepository.existsByEmail(employeur.getEmail())).thenReturn(false);

        // Act & Assert
        org.junit.jupiter.api.Assertions.assertThrows(
                InvalidMotPasseException.class,
                () -> employeurService.creerEmployeur(employeur.getEmail(), employeur.getPassword(), employeur.getTelephone(), employeur.getNomEntreprise(), employeur.getContact())
        );
    }

    @Test
    public void testCreationEmployeur_DeuxComptesMemeEmail() throws InvalidMotPasseException {
        // Arrange
        String email = "mon@employeur.com";
        Employeur employeur1 = new Employeur(email, "Etudiant12?", "(514) 582-9898", "Gogole", "Jaques L'heureux");
        when(employeurRepository.existsByEmail(email)).thenReturn(false);
        when(passwordEncoder.encode(any(CharSequence.class))).thenReturn("encodedPassword");
        when(employeurRepository.save(any(Employeur.class))).thenReturn(employeur1);

        // Premier compte créé sans exception
        employeurService.creerEmployeur(email, employeur1.getPassword(), employeur1.getTelephone(), employeur1.getNomEntreprise(), employeur1.getContact());

        // Simule que l'email existe déjà pour le deuxième compte
        when(employeurRepository.existsByEmail(email)).thenReturn(true);

        // Act & Assert
        org.junit.jupiter.api.Assertions.assertThrows(
                com.backend.Exceptions.EmailDejaUtilise.class,
                () -> employeurService.creerEmployeur(email, employeur1.getPassword(), employeur1.getTelephone(), employeur1.getNomEntreprise(), employeur1.getContact())
        );
    }
}
