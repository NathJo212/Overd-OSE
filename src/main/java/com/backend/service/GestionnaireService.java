package com.backend.service;


import com.backend.Exceptions.*;
import com.backend.modele.Etudiant;
import com.backend.modele.GestionnaireStage;
import com.backend.modele.Offre;
import com.backend.persistence.EtudiantRepository;
import com.backend.persistence.GestionnaireRepository;
import com.backend.persistence.OffreRepository;
import com.backend.persistence.UtilisateurRepository;
import com.backend.service.DTO.EtudiantDTO;
import com.backend.service.DTO.OffreDTO;
import com.backend.util.EncryptageCV;
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
    private final EtudiantRepository etudiantRepository;
    private final EncryptageCV encryptageCV;
    private final UtilisateurRepository utilisateurRepository;

    public GestionnaireService(OffreRepository offreRepository, GestionnaireRepository gestionnaireRepository, PasswordEncoder passwordEncoder, EtudiantRepository etudiantRepository,  EncryptageCV encryptageCV) {
    public GestionnaireService(OffreRepository offreRepository, GestionnaireRepository gestionnaireRepository,  PasswordEncoder passwordEncoder, UtilisateurRepository utilisateurRepository) {
        this.offreRepository = offreRepository;
        this.gestionnaireRepository = gestionnaireRepository;
        this.passwordEncoder = passwordEncoder;
        this.utilisateurRepository = utilisateurRepository;
        this.etudiantRepository = etudiantRepository;
        this.encryptageCV = encryptageCV;
    }

    @Transactional
    public void creerGestionnaire(String email, String password, String telephone, String prenom, String nom) throws MotPasseInvalideException, EmailDejaUtiliseException {
        boolean gestionnaireExistant = utilisateurRepository.existsByEmail(email);
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
                .filter(offre -> {
                    LocalDate dateLimite = offre.getDateLimite();
                    return dateLimite != null &&
                            (dateLimite.isAfter(LocalDate.now()) || dateLimite.isEqual(LocalDate.now()));
                })
                .map(offre -> new OffreDTO().toDTO(offre))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<OffreDTO> getAllOffres() throws ActionNonAutoriseeException {
        checkGestionnaireStageRole();
        List<Offre> toutesLesOffres = offreRepository.findAll();

        return toutesLesOffres.stream()
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
    public void approuveCV(Long etudiantId) throws ActionNonAutoriseeException, CVNonExistantException, CVDejaVerifieException {
        verifierGestionnaireConnecte();

        Etudiant etudiant = etudiantRepository.findById(etudiantId)
                .orElseThrow(() -> new CVNonExistantException());

        if (etudiant.getCv() == null || etudiant.getCv().length == 0) {
            throw new CVNonExistantException();
        }

        if (etudiant.getStatutCV() != Etudiant.StatutCV.ATTENTE) {
            throw new CVDejaVerifieException();
        }

        etudiant.setStatutCV(Etudiant.StatutCV.APPROUVE);
        etudiant.setMessageRefusCV(null);
        etudiantRepository.save(etudiant);
    }

    @Transactional
    public void refuseCV(Long etudiantId, String messageRefus) throws ActionNonAutoriseeException, CVNonExistantException, CVDejaVerifieException {
        verifierGestionnaireConnecte();

        Etudiant etudiant = etudiantRepository.findById(etudiantId)
                .orElseThrow(() -> new CVNonExistantException());

        if (etudiant.getCv() == null || etudiant.getCv().length == 0) {
            throw new CVNonExistantException();
        }

        if (etudiant.getStatutCV() != Etudiant.StatutCV.ATTENTE) {
            throw new CVDejaVerifieException();
        }

        etudiant.setStatutCV(Etudiant.StatutCV.REFUSE);
        etudiant.setMessageRefusCV(messageRefus);
        etudiantRepository.save(etudiant);
    }

    @Transactional
    public List<EtudiantDTO> getCVsEnAttente() throws ActionNonAutoriseeException {
        verifierGestionnaireConnecte();

        List<Etudiant> etudiants = etudiantRepository.findAllByStatutCV(Etudiant.StatutCV.ATTENTE);
        return etudiants.stream()
                .map(etudiant -> {
                    EtudiantDTO dto = new EtudiantDTO().toDTO(etudiant);
                    try {
                        if (etudiant.getCv() != null && etudiant.getCv().length > 0) {
                            String cvChiffre = new String(etudiant.getCv());
                            byte[] cvDechiffre = encryptageCV.dechiffrer(cvChiffre);
                            dto.setCv(cvDechiffre);
                        }
                    } catch (Exception e) {
                        dto.setCv(null);
                    }
                    return dto;
                })
                .toList();
    }

    private void verifierGestionnaireConnecte() throws ActionNonAutoriseeException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isGestionnaire = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("GESTIONNAIRE"));
        if (!isGestionnaire) {
            throw new ActionNonAutoriseeException();
        }
    }

}
