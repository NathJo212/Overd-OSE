package com.backend.service;


import com.backend.Exceptions.*;
import com.backend.modele.Etudiant;
import com.backend.modele.GestionnaireStage;
import com.backend.modele.Offre;
import com.backend.modele.EntenteStage;
import com.backend.modele.Notification;
import com.backend.modele.Employeur;
import com.backend.modele.Candidature;
import com.backend.persistence.EtudiantRepository;
import com.backend.persistence.GestionnaireRepository;
import com.backend.persistence.OffreRepository;
import com.backend.persistence.UtilisateurRepository;
import com.backend.persistence.EntenteStageRepository;
import com.backend.persistence.NotificationRepository;
import com.backend.persistence.EmployeurRepository;
import com.backend.persistence.CandidatureRepository;
import com.backend.service.DTO.CandidatureDTO;
import com.backend.service.DTO.EtudiantDTO;
import com.backend.service.DTO.OffreDTO;
import com.backend.service.DTO.EntenteStageDTO;
import com.backend.util.EncryptageCV;
import com.backend.util.EntentePdfGenerator;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private final EntenteStageRepository ententeStageRepository;
    private final NotificationRepository notificationRepository;
    private final EmployeurRepository employeurRepository;
    private final CandidatureRepository candidatureRepository;


    public GestionnaireService(OffreRepository offreRepository, GestionnaireRepository gestionnaireRepository, PasswordEncoder passwordEncoder, EtudiantRepository etudiantRepository,UtilisateurRepository utilisateurRepository,  EncryptageCV encryptageCV, EntenteStageRepository ententeStageRepository, NotificationRepository notificationRepository, EmployeurRepository employeurRepository, CandidatureRepository candidatureRepository) {
        this.offreRepository = offreRepository;
        this.gestionnaireRepository = gestionnaireRepository;
        this.passwordEncoder = passwordEncoder;
        this.utilisateurRepository = utilisateurRepository;
        this.etudiantRepository = etudiantRepository;
        this.encryptageCV = encryptageCV;
        this.ententeStageRepository = ententeStageRepository;
        this.notificationRepository = notificationRepository;
        this.employeurRepository = employeurRepository;
        this.candidatureRepository = candidatureRepository;
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

    public List<CandidatureDTO> getCandidaturesEligiblesEntente() throws ActionNonAutoriseeException {
        verifierGestionnaireConnecte();

        List<Candidature> candidatures = candidatureRepository.findByStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT);
        return candidatures.stream().map(c -> new CandidatureDTO().toDTO(c)).collect(Collectors.toList());
    }

    public void creerEntente(EntenteStageDTO dto) throws ActionNonAutoriseeException, OffreNonExistantException, UtilisateurPasTrouveException, CandidatureNonTrouveeException, com.backend.Exceptions.EntenteDejaExistanteException {
        verifierGestionnaireConnecte();

        if (dto.getOffreId() == null) {
            throw new OffreNonExistantException();
        }

        Offre offre = offreRepository.findById(dto.getOffreId()).orElseThrow(OffreNonExistantException::new);

        Employeur employeur = offre.getEmployeur();

        Etudiant etudiant = null;
        if (dto.getEtudiantId() != null) {
            etudiant = etudiantRepository.findById(dto.getEtudiantId()).orElseThrow(UtilisateurPasTrouveException::new);
        } else {
            throw new UtilisateurPasTrouveException();
        }

        // Vérifier qu'il n'existe pas déjà une entente non archivée pour cet étudiant et cette offre
        boolean ententeExistante = ententeStageRepository.existsByEtudiantAndOffreAndArchivedFalse(etudiant, offre);
        if (ententeExistante) {
            throw new com.backend.Exceptions.EntenteDejaExistanteException();
        }

        Candidature candidature = candidatureRepository.findByEtudiantAndOffre(etudiant, offre)
                .orElseThrow(CandidatureNonTrouveeException::new);

        if (candidature.getStatut() != Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT) {
            throw new StatutCandidatureInvalideException();
        }


        EntenteStage entente = new EntenteStage(etudiant, employeur, offre,
                dto.getTitre(), dto.getDescription(), dto.getDateDebut(), dto.getDateFin(),
                dto.getHoraire(), dto.getDureeHebdomadaire(), dto.getRemuneration(), dto.getResponsabilites(), dto.getObjectifs());

        entente.setDateCreation(LocalDateTime.now());
        entente.setDateModification(LocalDateTime.now());
        ententeStageRepository.save(entente);

        // PDF
        try {
            byte[] pdfBytes = EntentePdfGenerator.generatePdfBytes(entente);
            entente.setDocumentPdf(pdfBytes);
            ententeStageRepository.save(entente);
        } catch (IOException ioe) {
            System.out.println("Erreur");
        }

        try {
            Notification notifEtudiant = new Notification();
            notifEtudiant.setUtilisateur(etudiant);
            notifEtudiant.setMessageKey("entente.created");
            notifEtudiant.setMessageParam(offre.getTitre());
            notificationRepository.save(notifEtudiant);

            Notification notifEmployeur = new Notification();
            notifEmployeur.setUtilisateur(employeur);
            notifEmployeur.setMessageKey("entente.created");
            notifEmployeur.setMessageParam(offre.getTitre());
            notificationRepository.save(notifEmployeur);
        } catch (Exception e) {
            // ignore notification errors
        }
    }

    @Transactional
    public void modifierEntente(Long ententeId, EntenteStageDTO dto) throws ActionNonAutoriseeException, UtilisateurPasTrouveException, Exception {
        verifierGestionnaireConnecte();
        EntenteStage entente = ententeStageRepository.findById(ententeId).orElseThrow(() -> new Exception("Entente non trouvée"));

        // ne pas permettre la modification si déjà signée par toutes les parties ou si l'entente est annulee
        if (entente.getStatut() == EntenteStage.StatutEntente.SIGNEE || entente.getStatut() == EntenteStage.StatutEntente.ANNULEE) {
            //TODO modifier exception pour un autre type
            throw new Exception("Entente mauvaise");
        }


        // appliquer les changements
        entente.setTitre(dto.getTitre());
        entente.setDescription(dto.getDescription());
        entente.setDateDebut(dto.getDateDebut());
        entente.setDateFin(dto.getDateFin());
        entente.setHoraire(dto.getHoraire());
        entente.setDureeHebdomadaire(dto.getDureeHebdomadaire());
        entente.setRemuneration(dto.getRemuneration());
        entente.setResponsabilites(dto.getResponsabilites());
        entente.setObjectifs(dto.getObjectifs());
        entente.setDateModification(LocalDateTime.now());

        // reset signatures if modification before final signature
        entente.setEtudiantSignature(EntenteStage.SignatureStatus.EN_ATTENTE);
        entente.setEmployeurSignature(EntenteStage.SignatureStatus.EN_ATTENTE);
        entente.setStatut(EntenteStage.StatutEntente.EN_ATTENTE);

        ententeStageRepository.save(entente);

        // PDF et save
        try {
            byte[] pdfBytes = EntentePdfGenerator.generatePdfBytes(entente);
            entente.setDocumentPdf(pdfBytes);
            ententeStageRepository.save(entente);
        } catch (IOException ioe) {
            System.out.println("Erreur");
        }

        // notifications
        try {
            Notification notifEtudiant = new Notification();
            notifEtudiant.setUtilisateur(entente.getEtudiant());
            notifEtudiant.setMessageKey("entente.modified");
            notifEtudiant.setMessageParam(entente.getTitre());
            notificationRepository.save(notifEtudiant);

            Notification notifEmployeur = new Notification();
            notifEmployeur.setUtilisateur(entente.getEmployeur());
            notifEmployeur.setMessageKey("entente.modified");
            notifEmployeur.setMessageParam(entente.getTitre());
            notificationRepository.save(notifEmployeur);
        } catch (Exception e) {
            // ignore notification errors
        }
    }

    @Transactional
    public void annulerEntente(Long ententeId) throws ActionNonAutoriseeException, Exception {
        verifierGestionnaireConnecte();

        EntenteStage entente = ententeStageRepository.findById(ententeId).orElseThrow(() -> new Exception("Entente non trouvée"));
        entente.setStatut(EntenteStage.StatutEntente.ANNULEE);
        entente.setArchived(true);
        entente.setDateModification(LocalDateTime.now());
        ententeStageRepository.save(entente);

        // notifications
        try {
            Notification notifEtudiant = new Notification();
            notifEtudiant.setUtilisateur(entente.getEtudiant());
            notifEtudiant.setMessageKey("entente.cancelled");
            notifEtudiant.setMessageParam(entente.getTitre());
            notificationRepository.save(notifEtudiant);

            Notification notifEmployeur = new Notification();
            notifEmployeur.setUtilisateur(entente.getEmployeur());
            notifEmployeur.setMessageKey("entente.cancelled");
            notifEmployeur.setMessageParam(entente.getTitre());
            notificationRepository.save(notifEmployeur);
        } catch (Exception e) {
            // ignore
        }
    }

    @Transactional
    public List<EntenteStageDTO> getEntentesActives() throws ActionNonAutoriseeException {
        verifierGestionnaireConnecte();
        List<EntenteStage> ententes = ententeStageRepository.findByArchivedFalse();
        return ententes.stream().map(e -> new EntenteStageDTO().toDTO(e)).collect(Collectors.toList());
    }

    @Transactional
    public EntenteStageDTO getEntenteById(Long ententeId) throws ActionNonAutoriseeException, Exception {
        verifierGestionnaireConnecte();
        EntenteStage entente = ententeStageRepository.findById(ententeId).orElseThrow(() -> new Exception("Entente non trouvée"));
        return new EntenteStageDTO().toDTO(entente);
    }

    @Transactional
    public byte[] getEntenteDocument(Long ententeId) throws ActionNonAutoriseeException, Exception {
        verifierGestionnaireConnecte();
        EntenteStage entente = ententeStageRepository.findById(ententeId).orElseThrow(() -> new Exception("Entente non trouvée"));

        if (entente.getDocumentPdf() != null && entente.getDocumentPdf().length > 0) {
            return entente.getDocumentPdf();
        }

        throw new Exception("Document introuvable pour cette entente");
    }
}
