package com.backend.service;

import com.backend.Exceptions.*;
import com.backend.modele.*;
import com.backend.persistence.*;
import com.backend.service.DTO.*;
import com.backend.util.EncryptageCV;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class EtudiantService {

    private final PasswordEncoder passwordEncoder;
    private final EtudiantRepository etudiantRepository;
    private final OffreRepository offreRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EncryptageCV encryptageCV;
    private final CandidatureRepository candidatureRepository;
    private final NotificationRepository notificationRepository;
    private final EntenteStageRepository ententeStageRepository;

    public EtudiantService(PasswordEncoder passwordEncoder, EtudiantRepository etudiantRepository, OffreRepository offreRepository, UtilisateurRepository  utilisateurRepository, EncryptageCV encryptageCV, CandidatureRepository candidatureRepository, NotificationRepository notificationRepository, EntenteStageRepository ententeStageRepository) {
        this.passwordEncoder = passwordEncoder;
        this.etudiantRepository = etudiantRepository;
        this.offreRepository = offreRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.encryptageCV = encryptageCV;
        this.candidatureRepository = candidatureRepository;
        this.notificationRepository = notificationRepository;
        this.ententeStageRepository = ententeStageRepository;
    }

    @Transactional
    public void creerEtudiant(String email, String password, String telephone,
                              String prenom, String nom, ProgrammeDTO progEtude, String session, String annee) throws MotPasseInvalideException, EmailDejaUtiliseException {
        boolean etudiantExistant = utilisateurRepository.existsByEmail(email);
        if (etudiantExistant) {
            throw new EmailDejaUtiliseException();
        }
        String regex = "^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$";
        if (!Pattern.matches(regex, password)) {
            throw new MotPasseInvalideException();
        }
        String hashedPassword = passwordEncoder.encode(password);
        Etudiant etudiant = new Etudiant(email, hashedPassword, telephone, prenom, nom, Programme.toModele(progEtude), session, annee);
        etudiantRepository.save(etudiant);
    }

    @Transactional
    public void sauvegarderCvEtudiantConnecte(MultipartFile fichierCv) throws Exception {
        verifierFichierPdf(fichierCv);
        Etudiant etudiant = getEtudiantConnecte();
        byte[] cvBytes = fichierCv.getBytes();
        String cvChiffre = encryptageCV.chiffrer(cvBytes);
        etudiant.setCv(cvChiffre.getBytes());
        etudiantRepository.save(etudiant);
        etudiant.setStatutCV(Etudiant.StatutCV.ATTENTE);
    }

    @Transactional
    public CvDTO getCvEtudiantConnecte() throws Exception {
        Etudiant etudiant = getEtudiantConnecte();
        if (etudiant.getCv() == null || etudiant.getCv().length == 0) {
            throw new CVNonExistantException();
        }
        String cvChiffre = new String(etudiant.getCv());
        byte[] cvDechiffre = encryptageCV.dechiffrer(cvChiffre);
        return new CvDTO(cvDechiffre);
    }

    public void verifierFichierPdf(MultipartFile fichier) throws CvNonApprouveException {
        if (!"application/pdf".equalsIgnoreCase(fichier.getContentType())) {
            throw new CvNonApprouveException();
        }
        if (!Objects.requireNonNull(fichier.getOriginalFilename()).toLowerCase().endsWith(".pdf")) {
            throw new CvNonApprouveException();
        }
    }

    public Etudiant getEtudiantConnecte() throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isEtudiant = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ETUDIANT"));
        if (!isEtudiant) {
            throw new ActionNonAutoriseeException();
        }
        String email = auth.getName();
        if (etudiantRepository.existsByEmail(email)) {
            return etudiantRepository.findByEmail(email);
        }
        throw new UtilisateurPasTrouveException();
    }

    @Transactional
    public List<OffreDTO> getOffresApprouves() {
        List<Offre> offres = offreRepository.findAllByStatutApprouve(Offre.StatutApprouve.APPROUVE);
        return offres.stream()
                .map(offre -> new OffreDTO().toDTO(offre))
                .toList();
    }

    public StatutCvDTO getInfosCvEtudiantConnecte() throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Etudiant etudiant = getEtudiantConnecte();
        StatutCvDTO dto = new StatutCvDTO();
        dto.setStatutCV(etudiant.getStatutCV().name());
        dto.setMessageRefusCV(etudiant.getMessageRefusCV());
        return dto;
    }

    @Transactional
    public CandidatureDTO postulerOffre(Long offreId, MultipartFile lettreMotivationFichier)
            throws Exception {
        Etudiant etudiant = getEtudiantConnecte();

        if (etudiant.getStatutCV() != Etudiant.StatutCV.APPROUVE) {
            throw new CvNonApprouveException();
        }

        Offre offre = offreRepository.findById(offreId)
                .orElseThrow(OffreNonDisponible::new);

        if (offre.getStatutApprouve() != Offre.StatutApprouve.APPROUVE) {
            throw new OffreNonDisponible();
        }

        if (offre.getDateLimite() != null && LocalDate.now().isAfter(offre.getDateLimite())) {
            throw new OffreNonDisponible();
        }

        if (candidatureRepository.existsByEtudiantAndOffre(etudiant, offre)) {
            throw new OffreNonDisponible();
        }

        byte[] lettreMotivationChiffree = null;
        if (lettreMotivationFichier != null && !lettreMotivationFichier.isEmpty()) {
            byte[] lettreBytes = lettreMotivationFichier.getBytes();
            String lettreChiffree = encryptageCV.chiffrer(lettreBytes);
            lettreMotivationChiffree = lettreChiffree.getBytes(StandardCharsets.UTF_8);
        }

        Candidature candidature = new Candidature(etudiant, offre, lettreMotivationChiffree);
        candidature = candidatureRepository.save(candidature);

        return new CandidatureDTO().toDTO(candidature);
    }

    @Transactional
    public List<CandidatureDTO> getMesCandidatures() throws Exception {
        Etudiant etudiant = getEtudiantConnecte();
        List<Candidature> candidatures = candidatureRepository.findAllByEtudiant(etudiant);

        List<CandidatureDTO> candidatureDTOs = new ArrayList<>();
        for (Candidature candidature : candidatures) {
            candidatureDTOs.add(new CandidatureDTO().toDTO(candidature));
        }

        return candidatureDTOs;
    }

    @Transactional
    public byte[] getCvPourCandidature(Long candidatureId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException, CandidatureNonDisponibleException, CVNonExistantException {
        Etudiant etudiant = getEtudiantConnecte();

        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(CandidatureNonDisponibleException::new);

        if (!candidature.getEtudiant().getId().equals(etudiant.getId())) {
            throw new ActionNonAutoriseeException();
        }

        if (etudiant.getCv() == null || etudiant.getCv().length == 0) {
            throw new CVNonExistantException();
        }

        try {
            String cvChiffre = new String(etudiant.getCv());
            return encryptageCV.dechiffrer(cvChiffre);
        } catch (Exception e) {
            throw new CVNonExistantException();
        }
    }

    @Transactional
    public byte[] getLettreMotivationPourCandidature(Long candidatureId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException, CandidatureNonDisponibleException, LettreDeMotivationNonDisponibleException {
        Etudiant etudiant = getEtudiantConnecte();

        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(CandidatureNonDisponibleException::new);

        if (!candidature.getEtudiant().getId().equals(etudiant.getId())) {
            throw new ActionNonAutoriseeException();
        }

        if (candidature.getLettreMotivation() == null || candidature.getLettreMotivation().length == 0) {
            throw new LettreDeMotivationNonDisponibleException();
        }

        try {
            String lettreChiffree = new String(candidature.getLettreMotivation(), StandardCharsets.UTF_8);
            return encryptageCV.dechiffrer(lettreChiffree);
        } catch (Exception e) {
            throw new LettreDeMotivationNonDisponibleException();
        }
    }

    @Transactional
    public void retirerCandidature(Long candidatureId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException, CandidatureNonDisponibleException {
        Etudiant etudiant = getEtudiantConnecte();

        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(CandidatureNonDisponibleException::new);

        if (!candidature.getEtudiant().getId().equals(etudiant.getId())) {
            throw new ActionNonAutoriseeException();
        }

        if (candidature.getStatut() != Candidature.StatutCandidature.EN_ATTENTE) {
            throw new CandidatureNonDisponibleException();
        }

        candidature.setStatut(Candidature.StatutCandidature.RETIREE);
        candidatureRepository.save(candidature);
    }

    public boolean aPostuleOffre(Long offreId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException, OffreNonExistantException {
        Etudiant etudiant = getEtudiantConnecte();
        Offre offre = offreRepository.findById(offreId)
                .orElseThrow(OffreNonExistantException::new);
        return candidatureRepository.existsByEtudiantAndOffre(etudiant, offre);
    }

    @Transactional
    public ConvocationEntrevueDTO getConvocationPourCandidature(Long candidatureId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException, ConvocationNonTrouveeException {
        Etudiant etudiant = getEtudiantConnecte();

        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(ConvocationNonTrouveeException::new);

        if (!candidature.getEtudiant().getId().equals(etudiant.getId())) {
            throw new ActionNonAutoriseeException();
        }

        // Supposons que la convocation est stockée dans la candidature ou liée par une relation
        if (candidature.getConvocationEntrevue() == null) {
            throw new ConvocationNonTrouveeException();
        }

        // Conversion en DTO (adaptez selon votre structure)
        return new ConvocationEntrevueDTO().toDTO(candidature.getConvocationEntrevue());
    }

    @Transactional
    public List<NotificationDTO> getNotificationsPourEtudiantConnecte() throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Etudiant etudiant = getEtudiantConnecte();
        List<Notification> notes = notificationRepository.findAllByUtilisateurOrderByDateCreationDesc(etudiant);
        return notes.stream()
                    .map(n -> new NotificationDTO(n.getId(), n.getMessageKey(), n.getMessageParam(), n.isLu(), n.getDateCreation()))
                .collect(Collectors.toList());
    }

    @Transactional
    public NotificationDTO marquerNotificationLu(Long notificationId, boolean lu) throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Etudiant etudiant = getEtudiantConnecte();
        Notification notif;
        try {
            notif = notificationRepository.findById(notificationId).orElseThrow(() -> new Exception("Notification non trouvée"));
        } catch (Exception e) {
            throw new ActionNonAutoriseeException();
        }
        if (notif.getUtilisateur() == null || !notif.getUtilisateur().getId().equals(etudiant.getId())) {
            throw new ActionNonAutoriseeException();
        }
        notif.setLu(lu);
        notificationRepository.save(notif);

        return new NotificationDTO(notif.getId(), notif.getMessageKey(), notif.getMessageParam(), notif.isLu(), notif.getDateCreation());
    }

    @Transactional
    public void accepterOffreApprouvee(Long candidatureId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException, CandidatureNonDisponibleException, StatutCandidatureInvalideException {
        Etudiant etudiant = getEtudiantConnecte();

        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(CandidatureNonDisponibleException::new);

        if (!candidature.getEtudiant().getId().equals(etudiant.getId())) {
            throw new ActionNonAutoriseeException();
        }

        if (candidature.getStatut() != Candidature.StatutCandidature.ACCEPTEE) {
            throw new StatutCandidatureInvalideException();
        }

        candidature.setStatut(Candidature.StatutCandidature.ACCEPTEE_PAR_ETUDIANT);
        candidatureRepository.save(candidature);
    }

    @Transactional
    public void refuserOffreApprouvee(Long candidatureId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException, CandidatureNonDisponibleException, StatutCandidatureInvalideException {
        Etudiant etudiant = getEtudiantConnecte();

        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(CandidatureNonDisponibleException::new);

        if (!candidature.getEtudiant().getId().equals(etudiant.getId())) {
            throw new ActionNonAutoriseeException();
        }

        if (candidature.getStatut() != Candidature.StatutCandidature.ACCEPTEE) {
            throw new StatutCandidatureInvalideException();
        }

        candidature.setStatut(Candidature.StatutCandidature.REFUSEE_PAR_ETUDIANT);
        candidatureRepository.save(candidature);
    }

    @Transactional
    public void signerEntente(Long ententeId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException, EntenteNonTrouveeException, StatutEntenteInvalideException {
        Etudiant etudiant = getEtudiantConnecte();

        EntenteStage entente = ententeStageRepository.findById(ententeId)
                .orElseThrow(EntenteNonTrouveeException::new);

        if (entente.getEtudiant() == null || !entente.getEtudiant().getId().equals(etudiant.getId())) {
            throw new ActionNonAutoriseeException();
        }

        if (entente.getEtudiantSignature() != EntenteStage.SignatureStatus.EN_ATTENTE) {
            throw new StatutEntenteInvalideException();
        }

        entente.setEtudiantSignature(EntenteStage.SignatureStatus.SIGNEE);

        entente.setDateSignatureEtudiant(LocalDate.now());

        ententeStageRepository.save(entente);
    }

    @Transactional
    public void refuserEntente(Long ententeId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException, EntenteNonTrouveeException, StatutEntenteInvalideException {
        Etudiant etudiant = getEtudiantConnecte();

        EntenteStage entente = ententeStageRepository.findById(ententeId)
                .orElseThrow(EntenteNonTrouveeException::new);

        if (entente.getEtudiant() == null || !entente.getEtudiant().getId().equals(etudiant.getId())) {
            throw new ActionNonAutoriseeException();
        }

        if (entente.getEtudiantSignature() != EntenteStage.SignatureStatus.EN_ATTENTE) {
            throw new StatutEntenteInvalideException();
        }

        entente.setEtudiantSignature(EntenteStage.SignatureStatus.REFUSEE);
        entente.setStatut(EntenteStage.StatutEntente.ANNULEE);

        ententeStageRepository.save(entente);
    }

    @Transactional
    public List<EntenteStageDTO> getEntentesEnAttente()
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Etudiant etudiant = getEtudiantConnecte();

        List<EntenteStage> ententes = ententeStageRepository.findByEtudiantAndEtudiantSignatureAndArchivedFalse(
                etudiant,
                EntenteStage.SignatureStatus.EN_ATTENTE
        );

        return ententes.stream()
                .map(e -> new EntenteStageDTO().toDTO(e))
                .collect(Collectors.toList());
    }


    @Transactional
    public List<EntenteStageDTO> getMesEntentes()
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Etudiant etudiant = getEtudiantConnecte();

        List<EntenteStage> ententes = ententeStageRepository.findByEtudiantAndArchivedFalse(etudiant);

        return ententes.stream()
                .map(e -> new EntenteStageDTO().toDTO(e))
                .collect(Collectors.toList());
    }

}