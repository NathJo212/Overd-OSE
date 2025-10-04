package com.backend.service;


import com.backend.Exceptions.*;
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

import java.time.LocalDate;
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
            throw new EmailDejaUtiliseException();
        }
        String regex = "^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$";
        if (!Pattern.matches(regex, password)) {
            throw new MotPasseInvalideException();
        }
        String hashedPassword = passwordEncoder.encode(password);
        GestionnaireStage gestionnaireStage = new GestionnaireStage(email, hashedPassword, telephone, nom, prenom);
        gestionnaireRepository.save(gestionnaireStage);
    }


    @Transactional
    public void approuveOffre(Long id) throws ActionNonAutoriseeException, OffreNonExistantException, OffreDejaVerifieException {
        checkGestionnaireStageRole();
        Offre offre = offreRepository.findById(id)
                .orElseThrow(OffreNonExistantException::new);
        if (offre.getStatutApprouve() != Offre.StatutApprouve.ATTENTE){
            throw new OffreDejaVerifieException();
        }
        offre.setStatutApprouve(Offre.StatutApprouve.APPROUVE);
        offreRepository.save(offre);
    }

    @Transactional
    public void refuseOffre(Long id, String messageRefus) throws ActionNonAutoriseeException, OffreNonExistantException, OffreDejaVerifieException {
        checkGestionnaireStageRole();
        Offre offre = offreRepository.findById(id)
                .orElseThrow(OffreNonExistantException::new);
        if (offre.getStatutApprouve() != Offre.StatutApprouve.ATTENTE){
            throw new OffreDejaVerifieException();
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
            throw new ActionNonAutoriseeException();
        }
    }

    @Transactional
    public List<OffreDTO> getOffresApprouvees() throws ActionNonAutoriseeException {
        checkGestionnaireStageRole();
        List<Offre> offresApprouvees = offreRepository.findAllByStatutApprouve(Offre.StatutApprouve.APPROUVE);

        return offresApprouvees.stream()
                .map(offre -> new OffreDTO().toDTO(offre))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<OffreDTO> getOffresExpirees() throws ActionNonAutoriseeException {
        checkGestionnaireStageRole();
        LocalDate currentDate = LocalDate.now();

        List<Offre> offresExpirees = offreRepository.findAllByStatutApprouve(Offre.StatutApprouve.APPROUVE)
                .stream()
                .filter(offre -> offre.getDateLimite() != null && offre.getDateLimite().isBefore(currentDate))
                .collect(Collectors.toList());

        return offresExpirees.stream()
                .map(offre -> new OffreDTO().toDTO(offre))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<OffreDTO> getOffresEnCours() throws ActionNonAutoriseeException {
        checkGestionnaireStageRole();
        LocalDate currentDate = LocalDate.now();

        List<Offre> offresEnCours = offreRepository.findAllByStatutApprouve(Offre.StatutApprouve.APPROUVE)
                .stream()
                .filter(offre -> offre.getDate_fin() != null && offre.getDate_fin().isAfter(currentDate))
                .collect(Collectors.toList());

        return offresEnCours.stream()
                .map(offre -> new OffreDTO().toDTO(offre))
                .collect(Collectors.toList());
    }

}
