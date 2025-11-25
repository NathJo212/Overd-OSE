package com.backend.service;


import com.backend.Exceptions.*;
import com.backend.modele.*;
import com.backend.persistence.*;
import com.backend.service.DTO.*;
import com.backend.util.EncryptageCV;
import com.backend.util.CreateEntenteForm;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
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
    private final CandidatureRepository candidatureRepository;
    private final ProfesseurRepository professeurRepository;
    private final EmployeurRepository employeurRepository;
    private final EvaluationEtudiantParEmployeurRepository evaluationEtudiantParEmployeurRepository;
    private final EvaluationMilieuStageParProfesseurRepository evaluationMilieuStageParProfesseurRepository;


    public GestionnaireService(OffreRepository offreRepository,
                              GestionnaireRepository gestionnaireRepository,
                              PasswordEncoder passwordEncoder,
                              EtudiantRepository etudiantRepository,
                              UtilisateurRepository utilisateurRepository,
                              EncryptageCV encryptageCV,
                              EntenteStageRepository ententeStageRepository,
                              NotificationRepository notificationRepository,
                              CandidatureRepository candidatureRepository,
                              ProfesseurRepository professeurRepository,
                              EmployeurRepository employeurRepository,
                              EvaluationEtudiantParEmployeurRepository evaluationEtudiantParEmployeurRepository,
                              EvaluationMilieuStageParProfesseurRepository evaluationMilieuStageParProfesseurRepository) {
        this.offreRepository = offreRepository;
        this.gestionnaireRepository = gestionnaireRepository;
        this.passwordEncoder = passwordEncoder;
        this.utilisateurRepository = utilisateurRepository;
        this.etudiantRepository = etudiantRepository;
        this.encryptageCV = encryptageCV;
        this.ententeStageRepository = ententeStageRepository;
        this.notificationRepository = notificationRepository;
        this.candidatureRepository = candidatureRepository;
        this.professeurRepository = professeurRepository;
        this.employeurRepository = employeurRepository;
        this.evaluationEtudiantParEmployeurRepository = evaluationEtudiantParEmployeurRepository;
        this.evaluationMilieuStageParProfesseurRepository = evaluationMilieuStageParProfesseurRepository;
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

        try {
            if (offre.getProgEtude() != null) {
                List<Etudiant> matched = etudiantRepository.findAllByProgEtude(offre.getProgEtude());
                if (matched != null && !matched.isEmpty()) {
                    String titre = offre.getTitre() != null ? offre.getTitre() : "Nouvelle offre";

                    List<Notification> notifications = matched.stream().map(etudiant -> {
                        Notification n = new Notification(etudiant);
                        n.setMessageKey("offre.approuve");
                        // keep messageParam for backward compatibility (optional)
                        n.setMessageParam(titre);
                        return n;
                    }).toList();

                    notificationRepository.saveAll(notifications);
                }
            }
        } catch (Exception ex) {
            System.err.println("Erreur lors de la création des notifications: " + ex.getMessage());
        }
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
    public List<OffreDTO> getOffresAttente(Integer annee) throws ActionNonAutoriseeException {
        checkGestionnaireStageRole();

        List<Offre> offresEnAttente;

        if (annee != null) {
            offresEnAttente = offreRepository.findByStatutApprouveAndAnnee(Offre.StatutApprouve.ATTENTE, annee);
        } else {
            offresEnAttente = offreRepository.findByStatutApprouve(Offre.StatutApprouve.ATTENTE);
        }

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
    public List<OffreDTO> getAllOffres(Integer annee) throws ActionNonAutoriseeException {
        checkGestionnaireStageRole();

        List<Offre> toutesLesOffres;

        if (annee != null) {
            toutesLesOffres = offreRepository.findAllByAnnee(annee);
        } else {
            toutesLesOffres = offreRepository.findAll();
        }

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
                .orElseThrow(CVNonExistantException::new);

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
                .orElseThrow(CVNonExistantException::new);

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
    public List<EtudiantDTO> getCVsEnAttente(int annee) throws ActionNonAutoriseeException {
        verifierGestionnaireConnecte();

        List<Etudiant> etudiants;
        etudiants = etudiantRepository.findAllByStatutCVAndAnnee(Etudiant.StatutCV.ATTENTE, annee);

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
        boolean isGestionnaire = auth != null && auth.getAuthorities() != null
                && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("GESTIONNAIRE"));
        if (!isGestionnaire) {
            throw new ActionNonAutoriseeException();
        }
    }

    private int getAnneeAcademiqueCourante() {
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        if (now.getMonthValue() >= 8) {
            return year + 1;
        }
        return year;
    }

    private void verifierOffreAnneeCourante(Offre offre) throws ActionNonAutoriseeException {
        if (offre == null) {
            throw new ActionNonAutoriseeException();
        }
        int anneeOffre = offre.getAnnee();
        int anneeAcademiqueCourante = getAnneeAcademiqueCourante();
        if (anneeOffre != anneeAcademiqueCourante) {
            throw new ActionNonAutoriseeException();
        }
    }

    @Transactional
    public List<CandidatureDTO> getCandidaturesEligiblesEntente(Integer annee) throws ActionNonAutoriseeException {
        verifierGestionnaireConnecte();

        List<Candidature> candidatures;

        if (annee != null) {
            // Filtrer par année de l'offre si fournie
            candidatures = candidatureRepository.findByStatutAndOffre_Annee(
                    Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT,
                    annee
            );
        } else {
            // Récupérer toutes les candidatures acceptées
            candidatures = candidatureRepository.findByStatut(
                    Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT
            );
        }

        // Filtrer celles qui n'ont pas encore d'entente non archivée
        return candidatures.stream()
                .filter(c -> !ententeStageRepository.existsByEtudiantAndOffreAndArchivedFalse(
                        c.getEtudiant(),
                        c.getOffre()
                ))
                .map(c -> new CandidatureDTO().toDTO(c))
                .collect(Collectors.toList());
    }

    @Transactional
    public void creerEntente(EntenteStageDTO dto) throws ActionNonAutoriseeException, OffreNonExistantException, UtilisateurPasTrouveException, CandidatureNonTrouveeException, com.backend.Exceptions.EntenteDejaExistanteException, StatutCandidatureInvalideException {
        verifierGestionnaireConnecte();

        if (dto.getOffreId() == null) {
            throw new OffreNonExistantException();
        }

        Offre offre = offreRepository.findById(dto.getOffreId()).orElseThrow(OffreNonExistantException::new);

        verifierOffreAnneeCourante(offre);

        Employeur employeur = offre.getEmployeur();

        Etudiant etudiant;
        if (dto.getEtudiantId() != null) {
            etudiant = etudiantRepository.findById(dto.getEtudiantId()).orElseThrow(UtilisateurPasTrouveException::new);
        } else {
            throw new UtilisateurPasTrouveException();
        }

        // Vérifier qu'il n'existe pas déjà une entente non archivée pour cet étudiant et cette offre
        boolean ententeExistante = ententeStageRepository.existsByEtudiantAndOffreAndArchivedFalse(etudiant, offre);
        if (ententeExistante) {
            throw new EntenteDejaExistanteException();
        }

        Candidature candidature = candidatureRepository.findByEtudiantAndOffre(etudiant, offre)
                .orElseThrow(CandidatureNonTrouveeException::new);

        if (candidature.getStatut() != Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT) {
            throw new StatutCandidatureInvalideException();
        }


      EntenteStage entente = new EntenteStage(
                etudiant,
                employeur,
                offre
        );

        entente.setDateCreation(LocalDateTime.now());
        ententeStageRepository.save(entente);
    }

    @Transactional
    public void modifierEntente(Long ententeId, EntenteStageDTO dto) throws ActionNonAutoriseeException, UtilisateurPasTrouveException, EntenteModificationNonAutoriseeException, EntenteNonTrouveException {
        verifierGestionnaireConnecte();
        EntenteStage entente = ententeStageRepository.findById(ententeId).orElseThrow(EntenteNonTrouveException::new);

        verifierOffreAnneeCourante(entente.getOffre());

        if (entente.getStatut() == EntenteStage.StatutEntente.SIGNEE || entente.getStatut() == EntenteStage.StatutEntente.ANNULEE) {
            throw new EntenteModificationNonAutoriseeException();
        }


        // appliquer les changements
        entente.setTitre(dto.getTitre());
        entente.setDescription(dto.getDescription());
        entente.setDateDebut(dto.getDateDebut());
        entente.setDateFin(dto.getDateFin());
        entente.setHoraire(dto.getHoraire());
        entente.setDureeHebdomadaire(dto.getDureeHebdomadaire());
        entente.setRemuneration(dto.getRemuneration());
        entente.setResponsabilitesEtudiant(dto.getResponsabilitesEtudiant());
        entente.setResponsabilitesEmployeur(dto.getResponsabilitesEmployeur());
        entente.setResponsabilitesCollege(dto.getResponsabilitesCollege());
        entente.setObjectifs(dto.getObjectifs());

        // reset signatures if modification before final signature
        entente.setEtudiantSignature(EntenteStage.SignatureStatus.EN_ATTENTE);
        entente.setEmployeurSignature(EntenteStage.SignatureStatus.EN_ATTENTE);
        entente.setGestionnaireSignature(EntenteStage.SignatureStatus.EN_ATTENTE);
        entente.setStatut(EntenteStage.StatutEntente.EN_ATTENTE);
        // clear signature dates and previously generated document
        entente.setDateSignatureEtudiant(null);
        entente.setDateSignatureEmployeur(null);
        entente.setDateSignatureGestionnaire(null);
        entente.setPdfBase64(null);
        entente.setDateModification(LocalDateTime.now());

        ententeStageRepository.save(entente);

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
    public void annulerEntente(Long ententeId) throws ActionNonAutoriseeException, EntenteNonTrouveException {
        verifierGestionnaireConnecte();

        EntenteStage entente = ententeStageRepository.findById(ententeId).orElseThrow(EntenteNonTrouveException::new);

        verifierOffreAnneeCourante(entente.getOffre());

        entente.setStatut(EntenteStage.StatutEntente.ANNULEE);
        entente.setArchived(true);
        ententeStageRepository.save(entente);
    }

    @Transactional
    public List<EntenteStageDTO> getEntentesActives(Integer annee) throws ActionNonAutoriseeException {
        verifierGestionnaireConnecte();

        List<EntenteStage> ententes;

        if (annee != null) {
            // Filtrer par année si fournie
            ententes = ententeStageRepository.findByArchivedFalseAndOffre_Annee(annee);
        } else {
            // Récupérer toutes les ententes non archivées
            ententes = ententeStageRepository.findByArchivedFalse();
        }

        return ententes.stream().map(e -> new EntenteStageDTO().toDTO(e)).collect(Collectors.toList());
    }

    @Transactional
    public EntenteStageDTO getEntenteById(Long ententeId) throws ActionNonAutoriseeException, EntenteNonTrouveException {
        verifierGestionnaireConnecte();
        EntenteStage entente = ententeStageRepository.findById(ententeId).orElseThrow(EntenteNonTrouveException::new);
        return new EntenteStageDTO().toDTO(entente);
    }

    @Transactional
    public byte[] getEntenteDocument(Long ententeId) throws ActionNonAutoriseeException, EntenteNonTrouveException, EntenteDocumentNonTrouveeException {
        verifierGestionnaireConnecte();
        EntenteStage entente = ententeStageRepository.findById(ententeId).orElseThrow(EntenteNonTrouveException::new);

        if (entente.getPdfBase64() != null && !entente.getPdfBase64().isEmpty()) {
            try {
                return Base64.getDecoder().decode(entente.getPdfBase64());
            } catch (IllegalArgumentException e) {
                // invalid base64
            }
        }
        throw new EntenteDocumentNonTrouveeException();
    }

    @Transactional
    public void setEtudiantAProfesseur(Long professeurId, Long etudiantId) throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        verifierGestionnaireConnecte();

        Professeur professeur = professeurRepository.findById(professeurId)
                .orElseThrow(UtilisateurPasTrouveException::new);

        Etudiant etudiant = etudiantRepository.findById(etudiantId)
                .orElseThrow(UtilisateurPasTrouveException::new);

        etudiant.setProfesseur(professeur);
        etudiantRepository.save(etudiant);
    }

    @Transactional
    public List<EtudiantDTO> getAllEtudiants(int annee) throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        verifierGestionnaireConnecte();

        List<EtudiantDTO> etudiants = new ArrayList<>();
        for (Etudiant etudiant : etudiantRepository.findAllByAnnee(annee)) {
            etudiants.add(new EtudiantDTO().toDTO(etudiant));
        }

        return etudiants;

    }

    @Transactional
    public List<ProfesseurDTO> getAllProfesseurs() throws ActionNonAutoriseeException {
        verifierGestionnaireConnecte();
        List<Professeur> profs = professeurRepository.findAll();
        return profs.stream()
                .map(ProfesseurDTO::toDTO)
                .collect(Collectors.toList());
    }


    @Transactional
    public void signerEntente(Long ententeId)
            throws ActionNonAutoriseeException, EntenteNonTrouveException, StatutEntenteInvalideException {
        verifierGestionnaireConnecte();

        EntenteStage entente = ententeStageRepository.findById(ententeId)
                .orElseThrow(EntenteNonTrouveException::new);

        verifierOffreAnneeCourante(entente.getOffre());

        if (entente.getEtudiantSignature() != EntenteStage.SignatureStatus.SIGNEE
                || entente.getEmployeurSignature() != EntenteStage.SignatureStatus.SIGNEE) {
            throw new StatutEntenteInvalideException();
        }

        if (entente.getStatut() == EntenteStage.StatutEntente.SIGNEE
                || entente.getStatut() == EntenteStage.StatutEntente.ANNULEE) {
            throw new StatutEntenteInvalideException();
        }

        entente.setStatut(EntenteStage.StatutEntente.SIGNEE);
        entente.setGestionnaireSignature(EntenteStage.SignatureStatus.SIGNEE);
        entente.setDateSignatureGestionnaire(LocalDate.now());

        // Generate and store the final PDF upon final signature
        try {
            generateAndStoreEntentePdf(entente);
        } catch (IOException ioe) {
            // Keep entente signed even if PDF generation fails; log or handle as needed
        }
        ententeStageRepository.save(entente);
    }

    private void generateAndStoreEntentePdf(EntenteStage entente) throws IOException {
        String gestionnaireNom = null;
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                String email = auth.getName();
                Optional<Utilisateur> opt = utilisateurRepository.findByEmail(email);
                if (opt.isPresent() && opt.get() instanceof GestionnaireStage g) {
                    gestionnaireNom = g.getPrenom() + " " + g.getNom();
                }
            }
        } catch (Exception ignored) {}

        // Use utils CreateEntenteForm to build the final PDF bytes
        byte[] pdfBytes = CreateEntenteForm.generatePdfBytes(entente, gestionnaireNom);
        entente.setPdfBase64(Base64.getEncoder().encodeToString(pdfBytes));
    }

    @Transactional
    public void refuserEntente(Long ententeId)
            throws ActionNonAutoriseeException, EntenteNonTrouveException, StatutEntenteInvalideException {
        verifierGestionnaireConnecte();

        EntenteStage entente = ententeStageRepository.findById(ententeId)
                .orElseThrow(EntenteNonTrouveException::new);

        verifierOffreAnneeCourante(entente.getOffre());

        if (entente.getStatut() == EntenteStage.StatutEntente.SIGNEE
                || entente.getStatut() == EntenteStage.StatutEntente.ANNULEE) {
            throw new StatutEntenteInvalideException();
        }

        entente.setStatut(EntenteStage.StatutEntente.ANNULEE);
        entente.setGestionnaireSignature(EntenteStage.SignatureStatus.REFUSEE);
        entente.setArchived(true);
        ententeStageRepository.save(entente);
    }

    @Transactional
    public List<EntenteStageDTO> getEntentesEnAttente(Integer annee) throws ActionNonAutoriseeException {
        verifierGestionnaireConnecte();

        List<EntenteStage> ententes;

        if (annee != null) {
            ententes = ententeStageRepository.findByArchivedFalseAndOffre_Annee(annee);
        } else {
            ententes = ententeStageRepository.findByArchivedFalse();
        }

        return ententes.stream()
                .filter(e -> e.getEtudiantSignature() == EntenteStage.SignatureStatus.SIGNEE
                        && e.getEmployeurSignature() == EntenteStage.SignatureStatus.SIGNEE
                        && e.getStatut() == EntenteStage.StatutEntente.EN_ATTENTE)
                .map(e -> new EntenteStageDTO().toDTO(e))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<EntenteStageDTO> getEntentesFini(Integer annee) throws ActionNonAutoriseeException {
        verifierGestionnaireConnecte();

        List<EntenteStage> ententes;

        if (annee != null) {
            ententes = ententeStageRepository.findByArchivedFalseAndOffre_Annee(annee);
        } else {
            ententes = ententeStageRepository.findByArchivedFalse();
        }

        return ententes.stream()
                .filter(e -> e.getEtudiantSignature() == EntenteStage.SignatureStatus.SIGNEE
                        && e.getEmployeurSignature() == EntenteStage.SignatureStatus.SIGNEE
                        && e.getStatut() == EntenteStage.StatutEntente.SIGNEE)
                .map(e -> new EntenteStageDTO().toDTO(e))
                .collect(Collectors.toList());
    }

    @Transactional
    public DocumentsEntenteDTO getDocumentsEntente(Long id) throws ActionNonAutoriseeException, EntenteNonTrouveException {
        verifierGestionnaireConnecte();

        // récupérer l'entente
        EntenteStage ententeStage = ententeStageRepository.findById(id)
                .orElseThrow(EntenteNonTrouveException::new);

        DocumentsEntenteDTO documentsEntenteDTO = new DocumentsEntenteDTO();

        boolean any = false;

        // Contrat (entente) PDF s'il existe
        if (ententeStage.getPdfBase64() != null && !ententeStage.getPdfBase64().isEmpty()) {
            try {
                documentsEntenteDTO.setContractEntentepdf(Base64.getDecoder().decode(ententeStage.getPdfBase64()));
                any = true;
            } catch (IllegalArgumentException ignored) {
                // invalid base64, ignore
            }
        }

        // Évaluation faite par l'employeur (évaluation du stagiaire)
        try {
            var evalEmpOpt = evaluationEtudiantParEmployeurRepository.findAll().stream()
                    .filter(e -> e.getEntente() != null && e.getEntente().getId() != null && e.getEntente().getId().equals(id))
                    .findFirst();
            if (evalEmpOpt.isPresent()) {
                String b64 = evalEmpOpt.get().getPdfBase64();
                if (b64 != null && !b64.isEmpty()) {
                    try {
                        documentsEntenteDTO.setEvaluationStagiairepdf(Base64.getDecoder().decode(b64));
                        any = true;
                    } catch (IllegalArgumentException ignored) {}
                }
            }
        } catch (Exception ignored) {}

        // Évaluation milieu de stage faite par le professeur
        try {
            var evalProfOpt = evaluationMilieuStageParProfesseurRepository.findAll().stream()
                    .filter(e -> e.getEntente() != null && e.getEntente().getId() != null && e.getEntente().getId().equals(id))
                    .findFirst();
            if (evalProfOpt.isPresent()) {
                String b64 = evalProfOpt.get().getPdfBase64();
                if (b64 != null && !b64.isEmpty()) {
                    try {
                        documentsEntenteDTO.setEvaluationMilieuStagepdf(Base64.getDecoder().decode(b64));
                        any = true;
                    } catch (IllegalArgumentException ignored) {}
                }
            }
        } catch (Exception ignored) {}

        return any ? documentsEntenteDTO : null;
    }
}
