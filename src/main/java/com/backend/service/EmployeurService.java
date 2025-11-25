package com.backend.service;

import com.backend.Exceptions.*;
import com.backend.config.JwtTokenProvider;
import com.backend.modele.*;
import com.backend.persistence.*;
import com.backend.service.DTO.*;
import com.backend.util.EncryptageCV;
import com.backend.util.PdfGenerationEvaluation;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

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
    private final EntenteStageRepository ententeStageRepository;
    private final EvaluationEtudiantParEmployeurRepository evaluationRepository;
    private final PdfGenerationEvaluation pdfGenerationEvaluation;
    private final EtudiantRepository etudiantRepository;
    private final ProfesseurRepository professeurRepository;
    private final GestionnaireRepository gestionnaireRepository;

    @Autowired
    public EmployeurService(PasswordEncoder passwordEncoder, EmployeurRepository employeurRepository, OffreRepository offreRepository, JwtTokenProvider jwtTokenProvider, UtilisateurRepository utilisateurRepository, CandidatureRepository candidatureRepository, EncryptageCV encryptageCV, ConvocationEntrevueRepository convocationEntrevueRepository, NotificationRepository notificationRepository, EntenteStageRepository ententeStageRepository, EvaluationEtudiantParEmployeurRepository evaluationRepository, PdfGenerationEvaluation pdfGenerationEvaluation, EtudiantRepository etudiantRepository, ProfesseurRepository professeurRepository, GestionnaireRepository gestionnaireRepository) {
        this.passwordEncoder = passwordEncoder;
        this.employeurRepository = employeurRepository;
        this.offreRepository = offreRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.utilisateurRepository = utilisateurRepository;
        this.candidatureRepository = candidatureRepository;
        this.encryptageCV = encryptageCV;
        this.convocationEntrevueRepository = convocationEntrevueRepository;
        this.notificationRepository = notificationRepository;
        this.ententeStageRepository = ententeStageRepository;
        this.evaluationRepository = evaluationRepository;
        this.pdfGenerationEvaluation = pdfGenerationEvaluation;
        this.etudiantRepository = etudiantRepository;
        this.professeurRepository = professeurRepository;
        this.gestionnaireRepository = gestionnaireRepository;
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
    public void creerOffreDeStage(AuthResponseDTO utilisateur, String titre, String description, LocalDate date_debut, LocalDate date_fin, ProgrammeDTO progEtude, String lieuStage, String remuneration, LocalDate dateLimite, String horaire, Integer dureeHebdomadaire, String responsabilitesEtudiant, String responsabilitesEmployeur, String responsabiliteCollege, String objectifs) throws ActionNonAutoriseeException, DateInvalideException {
        String token = utilisateur.getToken();
        boolean isEmployeur = jwtTokenProvider.isEmployeur(token, jwtTokenProvider);
        if (!isEmployeur) {
            throw new ActionNonAutoriseeException();
        }

        // Validate dates
        if (date_fin != null && date_debut != null && date_fin.isBefore(date_debut)) {
            throw new DateInvalideException();
        }

        if (dateLimite != null && dateLimite.isAfter(date_debut)) {
            throw new DateInvalideException();
        }

        String email = jwtTokenProvider.getEmailFromJWT(token.startsWith("Bearer ") ? token.substring(7) : token);
        Employeur employeur = employeurRepository.findByEmail(email);
        Offre offre = new Offre(titre, description, date_debut, date_fin, Programme.toModele(progEtude), lieuStage, remuneration, dateLimite, employeur, horaire, dureeHebdomadaire, responsabilitesEtudiant, responsabilitesEmployeur, responsabiliteCollege, objectifs);
        offreRepository.save(offre);
    }

    @Transactional
    public List<OffreDTO> OffrePourEmployeur(AuthResponseDTO utilisateur, int annee) throws ActionNonAutoriseeException {
        String token = utilisateur.getToken();
        boolean isEmployeur = jwtTokenProvider.isEmployeur(token, jwtTokenProvider);
        if (!isEmployeur) {
            throw new ActionNonAutoriseeException();
        }
        String email = jwtTokenProvider.getEmailFromJWT(token.startsWith("Bearer ") ? token.substring(7) : token);
        Employeur employeur = employeurRepository.findByEmail(email);
        List<Offre> offres = offreRepository.findOffreByEmployeurId(employeur.getId());

        // Filter by year
        OffreDTO offreDTO = new OffreDTO();
        return offres.stream()
                .filter(offre -> offre.getAnnee() == annee)
                .map(offreDTO::toDTO)
                .toList();
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
    public List<CandidatureDTO> getCandidaturesPourEmployeur(int annee)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();
        List<Offre> offres = offreRepository.findOffreByEmployeurId(employeur.getId());

        // Filter offers by year
        List<Offre> offresParAnnee = offres.stream()
                .filter(offre -> offre.getAnnee() == annee)
                .toList();

        List<Candidature> candidatures = new ArrayList<>();
        for (Offre offre : offresParAnnee) {
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
    }

    @Transactional
    public List<ConvocationEntrevueDTO> getConvocationsPourEmployeur(int annee) throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();

        List<Offre> offres = offreRepository.findAllByEmployeur(employeur);

        // Filter offers by year
        List<Offre> offresParAnnee = offres.stream()
                .filter(offre -> offre.getAnnee() == annee)
                .toList();

        List<Candidature> candidatures = candidatureRepository.findAllByOffreIn(offresParAnnee);

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
    }

    @Transactional
    public List<NotificationDTO> getNotificationsPourEmployeurConnecte() throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();
        List<Notification> notes = notificationRepository.findAllByUtilisateurAndLuFalseOrderByDateCreationDesc(employeur);
        return notes.stream()
                .map(n -> new NotificationDTO(n.getId(), n.getMessageKey(), n.getMessageParam(), n.isLu(), n.getDateCreation()))
                .collect(Collectors.toList());
    }

    @Transactional
    public NotificationDTO marquerNotificationLu(Long notificationId, boolean lu) throws ActionNonAutoriseeException, UtilisateurPasTrouveException, NotificationPasTrouveException {
        Employeur employeur = getEmployeurConnecte();
        Notification notif;
        try {
            notif = notificationRepository.findById(notificationId).orElseThrow(NotificationPasTrouveException::new);
        } catch (Exception e) {
            throw new ActionNonAutoriseeException();
        }
        if (notif.getUtilisateur() == null || !notif.getUtilisateur().getId().equals(employeur.getId())) {
            throw new ActionNonAutoriseeException();
        }
        notif.setLu(lu);
        notificationRepository.save(notif);

        return new NotificationDTO(notif.getId(), notif.getMessageKey(), notif.getMessageParam(), notif.isLu(), notif.getDateCreation());
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
    public List<EntenteStageDTO> getEntentesPourEmployeur(int annee)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();

        List<EntenteStage> ententes = ententeStageRepository.findByEmployeurAndArchivedFalse(employeur);

        // Filter by year through the Offre
        List<EntenteStage> ententesParAnnee = ententes.stream()
                .filter(entente -> entente.getOffre() != null && entente.getOffre().getAnnee() == annee)
                .toList();

        return ententesParAnnee.stream()
                .map(entente -> new EntenteStageDTO().toDTO(entente))
                .toList();
    }

    @Transactional
    public List<EntenteStageDTO> getEntentesEnAttente(int annee)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();

        List<EntenteStage> ententes = ententeStageRepository.findByEmployeurAndEmployeurSignatureAndArchivedFalse(
                employeur,
                EntenteStage.SignatureStatus.EN_ATTENTE
        );

        // Filter by year through the Offre
        List<EntenteStage> ententesParAnnee = ententes.stream()
                .filter(entente -> entente.getOffre() != null && entente.getOffre().getAnnee() == annee)
                .toList();

        return ententesParAnnee.stream()
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
        entente.setDateSignatureEmployeur(LocalDate.now());

        ententeStageRepository.save(entente);
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

        ententeStageRepository.save(entente);
    }

    @Transactional
    public void creerEvaluation(CreerEvaluationDTO dto) throws ActionNonAutoriseeException, UtilisateurPasTrouveException, EntenteNonTrouveException, EvaluationDejaExistanteException, EntenteNonFinaliseeException, IOException {
        Employeur employeur = getEmployeurConnecte();
        EntenteStage entente = ententeStageRepository.findById(dto.getEntenteId()).orElseThrow(EntenteNonTrouveException::new);

        if(entente.getStatut() != EntenteStage.StatutEntente.SIGNEE){
            throw new EntenteNonFinaliseeException();
        }

        Etudiant etudiant = entente.getEtudiant();

        if (evaluationRepository.existsByEntenteId(entente.getId())) {
            throw new EvaluationDejaExistanteException();
        }
        String nomEtudiantComplet = etudiant.getPrenom() + " " + etudiant.getNom();
        String progEtude = etudiant.getProgEtude() != null ? etudiant.getProgEtude().name() : null;
        String pdfBase64 = pdfGenerationEvaluation.genererEtRemplirEvaluationPdf(dto, nomEtudiantComplet, progEtude, employeur.getNomEntreprise());

        EvaluationEtudiantParEmployeur eval = new EvaluationEtudiantParEmployeur();

        eval.setEntente(entente);
        eval.setEtudiant(etudiant);
        eval.setEmployeur(employeur);
        eval.setPdfBase64(pdfBase64);
        evaluationRepository.save(eval);

        new EvaluationDTO().toDTO(eval);
    }

    @Transactional
    public List<EvaluationDTO> getEvaluationsPourEmployeur(int annee) throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();
        List<EvaluationEtudiantParEmployeur> evaluations = evaluationRepository.findAllByEmployeurId(employeur.getId());

        // Filter evaluations by year through the Entente's Offre
        List<EvaluationEtudiantParEmployeur> evaluationsParAnnee = evaluations.stream()
                .filter(evaluation -> {
                    EntenteStage entente = evaluation.getEntente();
                    return entente != null && entente.getOffre() != null && entente.getOffre().getAnnee() == annee;
                })
                .toList();

        return evaluationsParAnnee.stream().map(e -> new EvaluationDTO().toDTO(e)).toList();
    }

    @Transactional
    public byte[] getEvaluationPdf(Long evaluationId) throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Employeur employeur = getEmployeurConnecte();

        EvaluationEtudiantParEmployeur evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new RuntimeException("Evaluation not found"));

        if (evaluation.getEmployeur() == null || !evaluation.getEmployeur().getId().equals(employeur.getId())) {
            throw new ActionNonAutoriseeException();
        }

        String base64 = evaluation.getPdfBase64();
        if (base64 == null || base64.isEmpty()) {
            throw new RuntimeException("Evaluation PDF not found");
        }

        try {
            return Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid base64 PDF data");
        }
    }

    @Transactional
    public byte[] getEntenteDocument(Long ententeId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException, EntenteNonTrouveException, EntenteDocumentNonTrouveeException {
        Employeur employeur = getEmployeurConnecte();

        EntenteStage entente = ententeStageRepository.findById(ententeId)
                .orElseThrow(EntenteNonTrouveException::new);

        // Vérifier que l'employeur est bien celui de l'entente
        if (entente.getEmployeur() == null || !entente.getEmployeur().getId().equals(employeur.getId())) {
            throw new ActionNonAutoriseeException();
        }

        // Vérifier que le gestionnaire a signé (donc le PDF est disponible)
        if (entente.getGestionnaireSignature() != EntenteStage.SignatureStatus.SIGNEE) {
            throw new EntenteDocumentNonTrouveeException();
        }

        if (entente.getPdfBase64() != null && !entente.getPdfBase64().isEmpty()) {
            try {
                return Base64.getDecoder().decode(entente.getPdfBase64());
            } catch (IllegalArgumentException e) {
                // invalid base64
            }
        }
        throw new EntenteDocumentNonTrouveeException();
    }

}
