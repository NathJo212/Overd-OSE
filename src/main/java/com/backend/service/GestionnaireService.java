package com.backend.service;


import com.backend.Exceptions.*;
import com.backend.modele.Employeur;
import com.backend.modele.Etudiant;
import com.backend.modele.GestionnaireStage;
import com.backend.modele.Offre;
import com.backend.persistence.GestionnaireRepository;
import com.backend.persistence.OffreRepository;
import com.backend.service.DTO.OffreDTO;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class GestionnaireService {

    private final OffreRepository offreRepository;
    private final GestionnaireRepository gestionnaireRepository;
    private final PasswordEncoder passwordEncoder;

    public GestionnaireService(OffreRepository offreRepository, GestionnaireRepository gestionnaireRepository,  PasswordEncoder passwordEncoder) {
        this.offreRepository = offreRepository;
        this.gestionnaireRepository = gestionnaireRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void creerGestionnaire(String email, String password, String telephone, String prenom, String nom) throws MotPasseInvalideException, EmailDejaUtiliseException {
        boolean gestionnaireExistant = gestionnaireRepository.existsByEmail(email);
        if (gestionnaireExistant) {
            throw new EmailDejaUtiliseException("Un utilisateur avec cet email existe déjà");
        }
        String regex = "^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$";
        if (!Pattern.matches(regex, password)) {
            throw new MotPasseInvalideException("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.");
        }
        String hashedPassword = passwordEncoder.encode(password);
        GestionnaireStage gestionnaireStage = new GestionnaireStage(email, hashedPassword, telephone, nom, prenom);
        gestionnaireRepository.save(gestionnaireStage);
    }


    @Transactional
    public void approuveOffre(Long id) throws ActionNonAutoriseeException, OffreNonExistantException, OffreDejaVerifieException {
        checkGestionnaireStageRole();
        Offre offre = offreRepository.findById(id)
                .orElseThrow(() -> new OffreNonExistantException("Offre introuvable"));
        if (offre.getStatutApprouve() != Offre.StatutApprouve.ATTENTE){
            throw new OffreDejaVerifieException("Cette offre a déjà été vérifiée par un gestionnaire.");
        }
        offre.setStatutApprouve(Offre.StatutApprouve.APPROUVE);
        offreRepository.save(offre);
    }

    @Transactional
    public void refuseOffre(Long id, String messageRefus) throws ActionNonAutoriseeException, OffreNonExistantException, OffreDejaVerifieException {
        checkGestionnaireStageRole();
        Offre offre = offreRepository.findById(id)
                .orElseThrow(() -> new OffreNonExistantException("Offre introuvable"));
        if (offre.getStatutApprouve() != Offre.StatutApprouve.ATTENTE){
            throw new OffreDejaVerifieException("Cette offre a déjà été vérifiée par un gestionnaire.");
        }
        offre.setStatutApprouve(Offre.StatutApprouve.REFUSE);
        offre.setMessageRefus(messageRefus);
        offreRepository.save(offre);
    }

    @Transactional
    public List<OffreDTO> getOffresAttente() throws ActionNonAutoriseeException {
        checkGestionnaireStageRole();
        List<Offre> offresEnAttente = offreRepository.findByStatutApprouve(Offre.StatutApprouve.ATTENTE);

        return offresEnAttente.stream()
                .map(offre -> new OffreDTO().toDTO(offre))
                .collect(Collectors.toList());
    }

    private void checkGestionnaireStageRole() throws ActionNonAutoriseeException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean hasRole = auth != null && auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("GESTIONNAIRE"));
        if (!hasRole) {
            throw new ActionNonAutoriseeException("Accès refusé : rôle gestionnaire requis");
        }
    }

}
