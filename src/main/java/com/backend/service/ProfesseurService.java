package com.backend.service;


import com.backend.Exceptions.*;
import com.backend.modele.*;
import com.backend.persistence.*;
import com.backend.service.DTO.*;
import com.backend.util.EncryptageCV;
import com.backend.util.PdfGenerationMilieuStage;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
public class ProfesseurService {

    private final ProfesseurRepository professeurRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final EtudiantRepository etudiantRepository;
    private final EncryptageCV encryptageCV;
    private final EntenteStageRepository ententeStageRepository;
    private final CandidatureRepository candidatureRepository;
    private final EvaluationMilieuStageParProfesseurRepository evaluationMilieuStageParProfesseurRepository;
    private final NotificationRepository notificationRepository;
    private final GestionnaireRepository gestionnaireRepository;
    private final PdfGenerationMilieuStage pdfGenerationMilieuStage;
    private final EmployeurRepository employeurRepository;


    public ProfesseurService(ProfesseurRepository professeurRepository, UtilisateurRepository utilisateurRepository, PasswordEncoder passwordEncoder, EtudiantRepository etudiantRepository, EncryptageCV encryptageCV, EntenteStageRepository ententeStageRepository, CandidatureRepository candidatureRepository, EvaluationMilieuStageParProfesseurRepository evaluationMilieuStageParProfesseurRepository, NotificationRepository notificationRepository, GestionnaireRepository gestionnaireRepository, PdfGenerationMilieuStage pdfGenerationMilieuStage, EmployeurRepository employeurRepository) {
        this.professeurRepository = professeurRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
        this.etudiantRepository = etudiantRepository;
        this.encryptageCV = encryptageCV;
        this.ententeStageRepository = ententeStageRepository;
        this.candidatureRepository = candidatureRepository;
        this.evaluationMilieuStageParProfesseurRepository = evaluationMilieuStageParProfesseurRepository;
        this.notificationRepository = notificationRepository;
        this.gestionnaireRepository = gestionnaireRepository;
        this.pdfGenerationMilieuStage = pdfGenerationMilieuStage;
        this.employeurRepository = employeurRepository;
    }

    @Transactional
    public void creerProfesseur(String email, String password, String telephone, String prenom, String nom) throws MotPasseInvalideException, EmailDejaUtiliseException {
        boolean professeurExistant = utilisateurRepository.existsByEmail(email);
        if (professeurExistant) {
            throw new EmailDejaUtiliseException();
        }
        String regex = "^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$";
        if (!Pattern.matches(regex, password)) {
            throw new MotPasseInvalideException();
        }
        String hashedPassword = passwordEncoder.encode(password);
        Professeur professeur = new Professeur(email, hashedPassword, telephone, nom, prenom);
        professeurRepository.save(professeur);
    }

    public Professeur getProfesseurConnecte() throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isProfesseur = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("PROFESSEUR"));
        if (!isProfesseur) {
            throw new ActionNonAutoriseeException();
        }
        String email = auth.getName();
        if (professeurRepository.existsByEmail(email)){
            return professeurRepository.findByEmail(email);
        }
        throw new UtilisateurPasTrouveException();
    }

    @Transactional
    public List<EtudiantDTO> getMesEtudiants(Long professeurId) throws UtilisateurPasTrouveException {
        Professeur professeur = professeurRepository.findById(professeurId)
                .orElseThrow(UtilisateurPasTrouveException::new);

        return professeur.getEtudiantList()
                .stream()
                .map(e -> new EtudiantDTO().toDTO(e))
                .toList();
    }

    @Transactional
    public byte[] getCvEtudiantPourProfesseur(Long etudiantId)
            throws CVNonExistantException, UtilisateurPasTrouveException {

        Etudiant etudiant = etudiantRepository.findById(etudiantId)
                .orElseThrow(UtilisateurPasTrouveException::new);

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
    public List<EntenteStageDTO> getEntentesPourEtudiant(Long etudiantId) throws UtilisateurPasTrouveException {
        if(!etudiantRepository.existsById(etudiantId)){
            throw new UtilisateurPasTrouveException();
        }
        List<EntenteStage> ententes = ententeStageRepository.findByEtudiantId(etudiantId);

        return ententes.stream()
                .map(entente -> new EntenteStageDTO().toDTO(entente))
                .toList();
    }

    @Transactional
    public List<CandidatureDTO> getCandidaturesPourEtudiant(Long etudiantId) throws UtilisateurPasTrouveException {
        if(!etudiantRepository.existsById(etudiantId)){
            throw new UtilisateurPasTrouveException();
        }

        List<Candidature> candidatures = candidatureRepository.findByEtudiantId(etudiantId);

        return candidatures.stream()
                .map(candidature -> new CandidatureDTO().toDTO(candidature))
                .toList();


    }

    @Transactional
    public byte[] getLettrePresentationParCandidature(Long candidatureId)
            throws UtilisateurPasTrouveException, LettreDeMotivationNonDisponibleException {
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(UtilisateurPasTrouveException::new);

        if (candidature.getLettreMotivation() == null || candidature.getLettreMotivation().length == 0) {
            throw new LettreDeMotivationNonDisponibleException();
        }

        try {
            // Follow CV logic: directly convert byte[] to String
            String lettreChiffree = new String(candidature.getLettreMotivation());
            return encryptageCV.dechiffrer(lettreChiffree);
        } catch (Exception e) {
            throw new LettreDeMotivationNonDisponibleException();
        }
    }


    @Transactional
    public StatutStageDTO getStatutStage(Long ententeId) throws EntenteNonTrouveeException {
        EntenteStage ententeStage = ententeStageRepository.findById(ententeId)
                .orElseThrow(EntenteNonTrouveeException::new);

        LocalDate now = LocalDate.now();
        LocalDate debut = ententeStage.getDateDebut();
        LocalDate fin = ententeStage.getDateFin();

        if (debut.isAfter(now)) {
            return StatutStageDTO.PAS_COMMENCE;
        } else if ((debut.isBefore(now) || debut.isEqual(now)) &&
                (fin.isAfter(now) || fin.isEqual(now))) {
            return StatutStageDTO.EN_COURS;
        } else {
            return StatutStageDTO.TERMINE;
        }
    }

    private int getAnneeAcademiqueCourante() {
        java.time.LocalDate now = java.time.LocalDate.now();
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
    public void creerEvaluationMilieuStage(CreerEvaluationMilieuStageDTO dto)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException,
            EntenteNonTrouveException, EvaluationDejaExistanteException, EntenteNonFinaliseeException {

        Professeur professeur = getProfesseurConnecte();

        EntenteStage entente = ententeStageRepository.findById(dto.getEntenteId())
                .orElseThrow(EntenteNonTrouveException::new);

        // Vérifier que l'entente est bien signée (finalisée)
        if (entente.getStatut() != EntenteStage.StatutEntente.SIGNEE) {
            throw new EntenteNonFinaliseeException();
        }

        // Vérifier qu'une évaluation n'existe pas déjà pour cette entente
        if (evaluationMilieuStageParProfesseurRepository.existsByEntenteId(dto.getEntenteId())) {
            throw new EvaluationDejaExistanteException();
        }

        verifierOffreAnneeCourante(entente.getOffre());

        // Vérifier que le professeur est bien le professeur superviseur de l'étudiant
        if (entente.getEtudiant().getProfesseur() == null ||
                !entente.getEtudiant().getProfesseur().getId().equals(professeur.getId())) {
            throw new ActionNonAutoriseeException();
        }

        EvaluationMilieuStage evaluation = new EvaluationMilieuStage();
        evaluation.setEntente(entente);
        evaluation.setProfesseur(professeur);
        evaluation.setEmployeur(entente.getEmployeur());
        evaluation.setEtudiant(entente.getEtudiant());

        // Générer le PDF à partir du DTO et sauvegarder le Base64 dans l'entité
        try {
            String pdfBase64 = pdfGenerationMilieuStage.genererEtRemplirMilieuStagePdf(dto);
            evaluation.setPdfBase64(pdfBase64);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }

        evaluationMilieuStageParProfesseurRepository.save(evaluation);
    }

    @Transactional
    public List<EvaluationMilieuStageDTO> getEvaluationsMilieuStagePourProfesseur()
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException {

        Professeur professeur = getProfesseurConnecte();

        List<EvaluationMilieuStage> evaluations =
                evaluationMilieuStageParProfesseurRepository.findAllByProfesseurId(professeur.getId());

        return evaluations.stream()
                .map(e -> new EvaluationMilieuStageDTO().toDTO(e))
                .toList();
    }

    @Transactional
    public EvaluationMilieuStageDTO getEvaluationMilieuStageSpecifique(Long evaluationId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException {

        Professeur professeur = getProfesseurConnecte();

        EvaluationMilieuStage evaluation = evaluationMilieuStageParProfesseurRepository
                .findById(evaluationId)
                .orElseThrow(() -> new RuntimeException("Évaluation non trouvée"));

        // Vérifier que c'est bien l'évaluation du professeur connecté
        if (!evaluation.getProfesseur().getId().equals(professeur.getId())) {
            throw new ActionNonAutoriseeException();
        }

        return new EvaluationMilieuStageDTO().toDTO(evaluation);
    }

    @Transactional
    public byte[] getEvaluationMilieuStagePdf(Long evaluationId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException {

        Professeur professeur = getProfesseurConnecte();

        EvaluationMilieuStage evaluation = evaluationMilieuStageParProfesseurRepository
                .findById(evaluationId)
                .orElseThrow(() -> new RuntimeException("Évaluation non trouvée"));

        // Vérifier que c'est bien l'évaluation du professeur connecté
        if (!evaluation.getProfesseur().getId().equals(professeur.getId())) {
            throw new ActionNonAutoriseeException();
        }

        if (evaluation.getPdfBase64() == null || evaluation.getPdfBase64().isEmpty()) {
            throw new RuntimeException("PDF non disponible");
        }

        return java.util.Base64.getDecoder().decode(evaluation.getPdfBase64());
    }

}
