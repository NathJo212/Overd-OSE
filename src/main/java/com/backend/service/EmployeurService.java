package com.backend.service;

import com.backend.Exceptions.*;
import com.backend.config.JwtTokenProvider;
import com.backend.modele.*;
import com.backend.persistence.*;
import com.backend.service.DTO.*;
import com.backend.util.EncryptageCV;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import com.backend.modele.Etudiant;

@Service
public class EmployeurService {

    private final PasswordEncoder passwordEncoder;
    private final EmployeurRepository employeurRepository;
    private final OffreRepository offreRepository;
    JwtTokenProvider jwtTokenProvider;
    private final UtilisateurRepository utilisateurRepository;
    private final CandidatureRepository candidatureRepository;
    private final EncryptageCV encryptageCV;
    private final ConvocationEntrevueRepository convocationEntrevueRepository;
    private final NotificationRepository notificationRepository;
    private final MessageSource messageSource;
    private final EntenteStageRepository ententeStageRepository;

    @Autowired
    public EmployeurService(PasswordEncoder passwordEncoder, EmployeurRepository employeurRepository, OffreRepository offreRepository, JwtTokenProvider jwtTokenProvider, UtilisateurRepository utilisateurRepository, CandidatureRepository candidatureRepository, EncryptageCV encryptageCV, ConvocationEntrevueRepository convocationEntrevueRepository, NotificationRepository notificationRepository, MessageSource messageSource, EntenteStageRepository ententeStageRepository) {
        this.passwordEncoder = passwordEncoder;
        this.employeurRepository = employeurRepository;
        this.offreRepository = offreRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.utilisateurRepository = utilisateurRepository;
        this.candidatureRepository = candidatureRepository;
        this.encryptageCV = encryptageCV;
        this.convocationEntrevueRepository = convocationEntrevueRepository;
        this.notificationRepository = notificationRepository;
        this.messageSource = messageSource;
        this.ententeStageRepository = ententeStageRepository;
    }

    @Transactional
    public void creerEmployeur(String email, String password, String telephone, String nomEntreprise, String contact) throws MotPasseInvalideException, EmailDejaUtiliseException {
        boolean employeurExistant = utilisateurRepository.existsByEmail(email);
        if (employeurExistant) {
            throw new EmailDejaUtiliseException();
        }
        String regex = "^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$";
        if (!Pattern.matches(regex, password)) {
            throw new MotPasseInvalideException();
        }
        String hashedPassword = passwordEncoder.encode(password);
        Employeur employeur = new Employeur(email, hashedPassword, telephone, nomEntreprise, contact);
        employeurRepository.save(employeur);
    }

    @Transactional
    public void creerOffreDeStage(AuthResponseDTO utilisateur, String titre, String description, LocalDate date_debut, LocalDate date_fin, ProgrammeDTO progEtude, String lieuStage, String remuneration, LocalDate dateLimite) throws ActionNonAutoriseeException, DateInvalideException {
        String token = utilisateur.getToken();
        boolean isEmployeur = jwtTokenProvider.isEmployeur(token, jwtTokenProvider);
        if (!isEmployeur) {
            throw new ActionNonAutoriseeException();
        }

        // Validate dates
        if (date_fin != null && date_debut != null && date_fin.isBefore(date_debut)) {
            throw new DateInvalideException();
        }

        String email = jwtTokenProvider.getEmailFromJWT(token.startsWith("Bearer ") ? token.substring(7) : token);
        Employeur employeur = employeurRepository.findByEmail(email);
        Offre offre = new Offre(titre, description, date_debut, date_fin, Programme.toModele(progEtude), lieuStage, remuneration, dateLimite, employeur);
        offreRepository.save(offre);
    }

    @Transactional
    public List<OffreDTO> OffrePourEmployeur(AuthResponseDTO utilisateur) throws ActionNonAutoriseeException {
        String token = utilisateur.getToken();
        boolean isEmployeur = jwtTokenProvider.isEmployeur(token, jwtTokenProvider);
        if (!isEmployeur) {
            throw new ActionNonAutoriseeException();
        }
        String email = jwtTokenProvider.getEmailFromJWT(token.startsWith("Bearer ") ? token.substring(7) : token);
        Employeur employeur = employeurRepository.findByEmail(email);
        List<Offre> offres = offreRepository.findOffreByEmployeurId(employeur.getId());
        OffreDTO offreDTO = new OffreDTO();
        return offres.stream().map(offreDTO::toDTO).toList();
    }

    public Employeur getEmployeurConnecte() throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        boolean isEmployeur = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("EMPLOYEUR"));

        if (!isEmployeur) {
            throw new ActionNonAutoriseeException();
        }

        String email = auth.getName();
        Employeur employeur = employeurRepository.findByEmail(email);

        if (employeur == null) {
            throw new UtilisateurPasTrouveException();
        }

        return employeur;
    }

    @Transactional
    public List<CandidatureDTO> getCandidaturesPourEmployeur()
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();
        List<Offre> offres = offreRepository.findOffreByEmployeurId(employeur.getId());

        List<Candidature> candidatures = new ArrayList<>();
        for (Offre offre : offres) {
            candidatures.addAll(offre.getCandidatures());
        }

        return candidatures.stream()
                .map(candidature -> new CandidatureDTO().toDTO(candidature))
                .toList();
    }

    @Transactional
    public CandidatureDTO getCandidatureSpecifique(Long candidatureId)
            throws ActionNonAutoriseeException, CandidatureNonTrouveeException {
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(CandidatureNonTrouveeException::new);

        return new CandidatureDTO().toDTO(candidature);
    }

    @Transactional
    public byte[] getCvPourCandidature(Long candidatureId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException, CVNonExistantException, CandidatureNonTrouveeException {
        Employeur employeur = getEmployeurConnecte();

        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(CandidatureNonTrouveeException::new);

        if (candidature.getOffre() == null ||
                candidature.getOffre().getEmployeur() == null ||
                !candidature.getOffre().getEmployeur().getId().equals(employeur.getId())) {
            throw new ActionNonAutoriseeException();
        }

        Etudiant etudiant = candidature.getEtudiant();

        if (etudiant.getCv() == null || etudiant.getCv().length == 0) {
            throw new CVNonExistantException();
        }

        try {
            String cvChiffre = new String(etudiant.getCv(), StandardCharsets.UTF_8);
            return encryptageCV.dechiffrer(cvChiffre);
        } catch (Exception e) {
            throw new CVNonExistantException();
        }
    }

    @Transactional
    public byte[] getLettreMotivationPourCandidature(Long candidatureId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException, CVNonExistantException, CandidatureNonTrouveeException {
        Employeur employeur = getEmployeurConnecte();

        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(CandidatureNonTrouveeException::new);

        if (candidature.getOffre() == null ||
                candidature.getOffre().getEmployeur() == null ||
                !candidature.getOffre().getEmployeur().getId().equals(employeur.getId())) {
            throw new ActionNonAutoriseeException();
        }

        if (candidature.getLettreMotivation() == null ||
                candidature.getLettreMotivation().length == 0) {
            throw new CVNonExistantException();
        }

        try {
            String lettreChiffree = new String(candidature.getLettreMotivation(),
                    StandardCharsets.UTF_8);
            return encryptageCV.dechiffrer(lettreChiffree);
        } catch (Exception e) {
            throw new CVNonExistantException();
        }
    }

    private String extractEmailFromToken(String token) {
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        return jwtTokenProvider.getEmailFromJWT(cleanToken);
    }


    @Transactional
    public void creerConvocation(ConvocationEntrevueDTO dto) throws ConvocationDejaExistanteException, CandidatureNonTrouveeException, ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();

        Candidature candidature = candidatureRepository.findById(dto.candidatureId)
                .orElseThrow(CandidatureNonTrouveeException::new);

        // Vérifier que la candidature appartient à une offre de cet employeur
        if (candidature.getOffre() == null ||
                candidature.getOffre().getEmployeur() == null ||
                !candidature.getOffre().getEmployeur().getId().equals(employeur.getId())) {
            throw new ActionNonAutoriseeException();
        }

        if (candidature.getConvocationEntrevue() != null) {
            throw new ConvocationDejaExistanteException();
        }

        ConvocationEntrevue convocation = new ConvocationEntrevue(candidature, dto.getDateHeure(), dto.lieuOuLien,  dto.message);

        convocationEntrevueRepository.save(convocation);
        candidature.setConvocationEntrevue(convocation);
        candidatureRepository.save(candidature);

        // créer et sauvegarder la notification pour l'étudiant lié
        Etudiant etudiant = candidature.getEtudiant();
        if (etudiant != null) {
            String titreOffre = candidature.getOffre() != null ? candidature.getOffre().getTitre() : null;
            Notification notif = new Notification();
            notif.setUtilisateur(etudiant);
            notif.setMessageKey("convocation.created");
            notif.setMessageParam(titreOffre);
            notificationRepository.save(notif);
        }
    }

    @Transactional
    public void modifierConvocation(ConvocationEntrevueDTO dto) throws CandidatureNonTrouveeException, ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();

        Candidature candidature = candidatureRepository.findById(dto.candidatureId)
                .orElseThrow(CandidatureNonTrouveeException::new);

        // Vérifier que la candidature appartient à une offre de cet employeur
        if (candidature.getOffre() == null ||
                candidature.getOffre().getEmployeur() == null ||
                !candidature.getOffre().getEmployeur().getId().equals(employeur.getId())) {
            throw new ActionNonAutoriseeException();
        }

        ConvocationEntrevue convocation = candidature.getConvocationEntrevue();
        if (convocation == null) {
            throw new CandidatureNonTrouveeException();
        }

        if (dto.getDateHeure() != null) convocation.setDateHeure(dto.getDateHeure());
        if (dto.lieuOuLien != null) convocation.setLieuOuLien(dto.lieuOuLien);
        if (dto.message != null) convocation.setMessage(dto.message);
        convocation.setStatut(ConvocationEntrevue.StatutConvocation.MODIFIE);

        convocationEntrevueRepository.save(convocation);

        // notification de modification pour l'étudiant
        Etudiant etudiant = candidature.getEtudiant();
        if (etudiant != null) {
            String titreOffre = candidature.getOffre() != null ? candidature.getOffre().getTitre() : null;
            Notification notif = new Notification();
            notif.setUtilisateur(etudiant);
            notif.setMessageKey("convocation.modified");
            notif.setMessageParam(titreOffre);
            notificationRepository.save(notif);
        }
    }

    @Transactional
    public void annulerConvocation(Long candidatureId) throws CandidatureNonTrouveeException, ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();

        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(CandidatureNonTrouveeException::new);

        // Vérifier que la candidature appartient à une offre de cet employeur
        if (candidature.getOffre() == null ||
                candidature.getOffre().getEmployeur() == null ||
                !candidature.getOffre().getEmployeur().getId().equals(employeur.getId())) {
            throw new ActionNonAutoriseeException();
        }

        ConvocationEntrevue convocation = candidature.getConvocationEntrevue();
        if (convocation == null) {
            throw new CandidatureNonTrouveeException();
        }

        convocation.setStatut(ConvocationEntrevue.StatutConvocation.ANNULEE);
        convocationEntrevueRepository.save(convocation);

        // notification d'annulation pour l'étudiant
        Etudiant etudiant = candidature.getEtudiant();
        if (etudiant != null) {
            String titreOffre = candidature.getOffre() != null ? candidature.getOffre().getTitre() : null;
            Notification notif = new Notification();
            notif.setUtilisateur(etudiant);
            notif.setMessageKey("convocation.cancelled");
            notif.setMessageParam(titreOffre);
            notificationRepository.save(notif);
        }
    }

    @Transactional
    public List<ConvocationEntrevueDTO> getConvocationsPourEmployeur() throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();

        List<Offre> offres = offreRepository.findAllByEmployeur(employeur);

        List<Candidature> candidatures = candidatureRepository.findAllByOffreIn(offres);

        List<ConvocationEntrevueDTO> convocations = new ArrayList<>();
        for (Candidature candidature : candidatures) {
            if (candidature.getConvocationEntrevue() != null) {
                convocations.add(new ConvocationEntrevueDTO().toDTO(candidature.getConvocationEntrevue()));
            }
        }
        return convocations;
    }

    @Transactional
    public void approuverCandidature(Long candidatureId) throws ActionNonAutoriseeException, UtilisateurPasTrouveException, CandidatureNonTrouveeException, CandidatureDejaVerifieException {
        Employeur employeur = getEmployeurConnecte();

        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(CandidatureNonTrouveeException::new);

        if (candidature.getOffre() == null || candidature.getOffre().getEmployeur() == null ||
                !candidature.getOffre().getEmployeur().getId().equals(employeur.getId())) {
            throw new ActionNonAutoriseeException();
        }
        if (candidature.getStatut() != Candidature.StatutCandidature.EN_ATTENTE){
            throw new CandidatureDejaVerifieException();
        }
        candidature.setStatut(Candidature.StatutCandidature.ACCEPTEE);
        candidatureRepository.save(candidature);

        Etudiant etudiant = candidature.getEtudiant();
        if (etudiant != null) {
            String titreOffre = candidature.getOffre() != null ? candidature.getOffre().getTitre() : null;
            Notification notif = new Notification();
            notif.setUtilisateur(etudiant);
            notif.setMessageKey("offre.approved");
            notif.setMessageParam(titreOffre);
            notificationRepository.save(notif);
        }
    }

    @Transactional
    public void refuserCandidature(Long candidatureId, String raison) throws ActionNonAutoriseeException, UtilisateurPasTrouveException, CandidatureNonTrouveeException, CandidatureDejaVerifieException {
        Employeur employeur = getEmployeurConnecte();

        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(CandidatureNonTrouveeException::new);

        if (candidature.getOffre() == null || candidature.getOffre().getEmployeur() == null
                || !candidature.getOffre().getEmployeur().getId().equals(employeur.getId())) {
            throw new ActionNonAutoriseeException();
        }
        if (candidature.getStatut() != Candidature.StatutCandidature.EN_ATTENTE){
            throw new CandidatureDejaVerifieException();
        }
        candidature.setStatut(Candidature.StatutCandidature.REFUSEE);
        candidature.setMessageReponse(raison);
        candidatureRepository.save(candidature);

        Etudiant etudiant = candidature.getEtudiant();
        if (etudiant != null) {
            String titreOffre = candidature.getOffre() != null ? candidature.getOffre().getTitre() : null;
            Notification notif = new Notification();
            notif.setUtilisateur(etudiant);
            notif.setMessageKey("offre.refused");
            notif.setMessageParam(titreOffre);
            notificationRepository.save(notif);
        }
    }

    @Transactional
    public List<NotificationDTO> getNotificationsPourEmployeurConnecte() throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();

        List<Notification> notifications = notificationRepository.findAllByUtilisateurOrderByDateCreationDesc(employeur);

        List<NotificationDTO> notificationDTOs = new ArrayList<>();
        for (Notification notification : notifications) {
            notificationDTOs.add(new NotificationDTO(
                notification.getId(),
                notification.getMessageKey(),
                notification.getMessageParam(),
                notification.isLu(),
                notification.getDateCreation()
            ));
        }
        return notificationDTOs;
    }

    @Transactional
    public void marquerNotificationLu(Long notificationId, boolean lu) throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUtilisateur().getId().equals(employeur.getId())) {
            throw new ActionNonAutoriseeException();
        }

        notification.setLu(lu);
        notificationRepository.save(notification);
    }

    @Transactional
    public List<OffreDTO> getOffresApprouvees() throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();

        List<Offre> offres = offreRepository.findOffreByEmployeurId(employeur.getId());

        List<Offre> offresApprouvees = offres.stream()
                .filter(offre -> offre.getStatutApprouve() == Offre.StatutApprouve.APPROUVE)
                .toList();

        OffreDTO offreDTO = new OffreDTO();
        return offresApprouvees.stream().map(offreDTO::toDTO).toList();
    }

    @Transactional
    public List<EntenteStageDTO> getEntentesPourEmployeur() throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();

        List<EntenteStage> ententes = ententeStageRepository.findByEmployeurAndArchivedFalse(employeur);

        return ententes.stream()
                .map(entente -> new EntenteStageDTO().toDTO(entente))
                .toList();
    }

    @Transactional
    public List<EntenteStageDTO> getEntentesEnAttente() throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();

        List<EntenteStage> ententes = ententeStageRepository.findByEmployeurAndEmployeurSignatureAndArchivedFalse(
                employeur,
                EntenteStage.SignatureStatus.EN_ATTENTE
        );

        return ententes.stream()
                .map(e -> new EntenteStageDTO().toDTO(e))
                .toList();
    }

    @Transactional
    public EntenteStageDTO getEntenteSpecifique(Long ententeId) throws ActionNonAutoriseeException, UtilisateurPasTrouveException, EntenteNonTrouveException {
        Employeur employeur = getEmployeurConnecte();

        EntenteStage entente = ententeStageRepository.findById(ententeId).orElseThrow(EntenteNonTrouveException::new);

        if (entente.getEmployeur() == null || !entente.getEmployeur().getId().equals(employeur.getId())) {
            throw new ActionNonAutoriseeException();
        }

        return new EntenteStageDTO().toDTO(entente);
    }

    @Transactional
    public void signerEntente(Long ententeId) throws ActionNonAutoriseeException, UtilisateurPasTrouveException, EntenteNonTrouveException, StatutEntenteInvalideException {
        Employeur employeur = getEmployeurConnecte();

        EntenteStage entente = ententeStageRepository.findById(ententeId).orElseThrow(EntenteNonTrouveException::new);

        if (!entente.getEmployeur().getId().equals(employeur.getId())) {
            throw new ActionNonAutoriseeException();
        }

        if (entente.getEmployeurSignature() != EntenteStage.SignatureStatus.EN_ATTENTE) {
            throw new StatutEntenteInvalideException();
        }

        entente.setEmployeurSignature(EntenteStage.SignatureStatus.SIGNEE);
        entente.setDateModification(LocalDateTime.now());

        // Si les deux ont signé, marquer l'entente comme signée
        if (entente.getEtudiantSignature() == EntenteStage.SignatureStatus.SIGNEE) {
            entente.setStatut(EntenteStage.StatutEntente.SIGNEE);
        }

        ententeStageRepository.save(entente);

        // Notification pour l'étudiant
        Etudiant etudiant = entente.getEtudiant();
        if (etudiant != null) {
            Notification notif = new Notification();
            notif.setUtilisateur(etudiant);
            notif.setMessageKey("entente.employer.signed");
            notif.setMessageParam(entente.getTitre());
            notificationRepository.save(notif);
        }
    }

    @Transactional
    public void refuserEntente(Long ententeId) throws ActionNonAutoriseeException, UtilisateurPasTrouveException, EntenteNonTrouveException, StatutEntenteInvalideException {
        Employeur employeur = getEmployeurConnecte();

        EntenteStage entente = ententeStageRepository.findById(ententeId).orElseThrow(EntenteNonTrouveException::new);

        if (!entente.getEmployeur().getId().equals(employeur.getId())) {
            throw new ActionNonAutoriseeException();
        }

        if (entente.getEmployeurSignature() != EntenteStage.SignatureStatus.EN_ATTENTE) {
            throw new StatutEntenteInvalideException();
        }

        entente.setEmployeurSignature(EntenteStage.SignatureStatus.REFUSEE);
        entente.setStatut(EntenteStage.StatutEntente.ANNULEE);
        entente.setDateModification(LocalDateTime.now());

        ententeStageRepository.save(entente);

        // Notification pour l'étudiant
        Etudiant etudiant = entente.getEtudiant();
        if (etudiant != null) {
            Notification notif = new Notification();
            notif.setUtilisateur(etudiant);
            notif.setMessageKey("entente.employer.refused");
            notif.setMessageParam(entente.getTitre());
            notificationRepository.save(notif);
        }
    }
}
