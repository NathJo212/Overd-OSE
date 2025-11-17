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
    private final EmployeurRepository employeurRepository;


    public ProfesseurService(ProfesseurRepository professeurRepository, UtilisateurRepository utilisateurRepository, PasswordEncoder passwordEncoder, EtudiantRepository etudiantRepository, EncryptageCV encryptageCV, EntenteStageRepository ententeStageRepository, CandidatureRepository candidatureRepository, EvaluationMilieuStageParProfesseurRepository evaluationMilieuStageParProfesseurRepository, NotificationRepository notificationRepository, GestionnaireRepository gestionnaireRepository, EmployeurRepository employeurRepository) {
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

        // Vérifier que le professeur est bien le professeur superviseur de l'étudiant
        if (entente.getEtudiant().getProfesseur() == null ||
                !entente.getEtudiant().getProfesseur().getId().equals(professeur.getId())) {
            throw new ActionNonAutoriseeException();
        }

        EvaluationMilieuStageParProfesseur evaluation = new EvaluationMilieuStageParProfesseur();
        evaluation.setEntente(entente);
        evaluation.setProfesseur(professeur);
        evaluation.setEmployeur(entente.getEmployeur());
        evaluation.setEtudiant(entente.getEtudiant());
        evaluation.setQualiteEncadrement(dto.getQualiteEncadrement());
        evaluation.setPertinenceMissions(dto.getPertinenceMissions());
        evaluation.setRespectHorairesConditions(dto.getRespectHorairesConditions());
        evaluation.setCommunicationDisponibilite(dto.getCommunicationDisponibilite());
        evaluation.setCommentairesAmelioration(dto.getCommentairesAmelioration());

        evaluationMilieuStageParProfesseurRepository.save(evaluation);

        // Envoyer des notifications au gestionnaire et à l'employeur
        try {
            // Notification pour l'employeur
            if (entente.getEmployeur() != null) {
                Notification notifEmployeur = new Notification();
                notifEmployeur.setUtilisateur(entente.getEmployeur());
                notifEmployeur.setMessageKey("evaluation.milieu.stage.creee");
                String nomEtudiant = (entente.getEtudiant().getPrenom() != null ? entente.getEtudiant().getPrenom() : "")
                        + " " + (entente.getEtudiant().getNom() != null ? entente.getEtudiant().getNom() : "");
                notifEmployeur.setMessageParam(nomEtudiant.trim());
                notificationRepository.save(notifEmployeur);
            }

            // Notifications pour tous les gestionnaires
            List<GestionnaireStage> gestionnaires = (List<GestionnaireStage>) gestionnaireRepository.findAll();
            for (GestionnaireStage gestionnaire : gestionnaires) {
                Notification notifGestionnaire = new Notification();
                notifGestionnaire.setUtilisateur(gestionnaire);
                notifGestionnaire.setMessageKey("evaluation.milieu.stage.creee");
                String nomEtudiant = (entente.getEtudiant().getPrenom() != null ? entente.getEtudiant().getPrenom() : "")
                        + " " + (entente.getEtudiant().getNom() != null ? entente.getEtudiant().getNom() : "");
                notifGestionnaire.setMessageParam(nomEtudiant.trim());
                notificationRepository.save(notifGestionnaire);
            }
        } catch (Exception e) {
            // Log l'erreur mais ne pas empêcher la création de l'évaluation
            System.err.println("Erreur lors de l'envoi des notifications pour l'évaluation: " + e.getMessage());
        }
    }

    @Transactional
    public List<EvaluationMilieuStageDTO> getEvaluationsMilieuStagePourProfesseur()
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException {

        Professeur professeur = getProfesseurConnecte();

        List<EvaluationMilieuStageParProfesseur> evaluations =
                evaluationMilieuStageParProfesseurRepository.findAllByProfesseurId(professeur.getId());

        return evaluations.stream()
                .map(e -> new EvaluationMilieuStageDTO().toDTO(e))
                .toList();
    }

    @Transactional
    public EvaluationMilieuStageDTO getEvaluationMilieuStageSpecifique(Long evaluationId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException {

        Professeur professeur = getProfesseurConnecte();

        EvaluationMilieuStageParProfesseur evaluation = evaluationMilieuStageParProfesseurRepository
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

        EvaluationMilieuStageParProfesseur evaluation = evaluationMilieuStageParProfesseurRepository
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









    @Transactional
    public EtudiantDTO getEtudiantInfo(Long etudiantId) throws UtilisateurPasTrouveException {
        Etudiant etudiant = etudiantRepository.findById(etudiantId)
                .orElseThrow(UtilisateurPasTrouveException::new);
        return new EtudiantDTO().toDTO(etudiant);
    }

    @Transactional
    public EmployeurDTO getEmployeurInfo(Long employeurId) throws UtilisateurPasTrouveException {
        Employeur employeur = employeurRepository.findById(employeurId)
                .orElseThrow(UtilisateurPasTrouveException::new);
        return new EmployeurDTO().toDTO(employeur);
    }

    @Transactional
    public ProfesseurDTO getProfesseurInfo(Long professeurId) throws UtilisateurPasTrouveException {
        Professeur professeur = professeurRepository.findById(professeurId)
                .orElseThrow(UtilisateurPasTrouveException::new);
        return ProfesseurDTO.toDTO(professeur);
    }

    @Transactional
    public GestionnaireDTO getGestionnaireInfo(Long gestionnaireId) throws UtilisateurPasTrouveException {
        GestionnaireStage gestionnaire = gestionnaireRepository.findById(gestionnaireId)
                .orElseThrow(UtilisateurPasTrouveException::new);
        return GestionnaireDTO.toDTO(gestionnaire);
    }

    @Transactional
    public List<EtudiantDTO> searchEtudiants(String searchTerm)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException {

        getProfesseurConnecte();

        Iterable<Etudiant> iterableEtudiants = etudiantRepository.findAll();
        List<Etudiant> etudiants = StreamSupport.stream(iterableEtudiants.spliterator(), false)
                .collect(Collectors.toList());

        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            String search = searchTerm.toLowerCase();
            etudiants = etudiants.stream()
                    .filter(e -> (e.getNom() != null && e.getNom().toLowerCase().contains(search)) ||
                            (e.getPrenom() != null && e.getPrenom().toLowerCase().contains(search)) ||
                            (e.getEmail() != null && e.getEmail().toLowerCase().contains(search)))
                    .toList();
        }

        return etudiants.stream()
                .map(e -> new EtudiantDTO().toDTO(e))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<EmployeurDTO> searchEmployeurs(String searchTerm) throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        getProfesseurConnecte();

        Iterable<Employeur> iterableEmployeurs = employeurRepository.findAll();
        List<Employeur> employeurs = StreamSupport.stream(iterableEmployeurs.spliterator(), false)
                .collect(Collectors.toList());

        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            String search = searchTerm.toLowerCase();
            employeurs = employeurs.stream()
                    .filter(e -> (e.getNomEntreprise() != null && e.getNomEntreprise().toLowerCase().contains(search)) ||
                            (e.getEmail() != null && e.getEmail().toLowerCase().contains(search)) ||
                            (e.getContact() != null && e.getContact().toLowerCase().contains(search)))
                    .toList();
        }

        return employeurs.stream()
                .map(e -> new EmployeurDTO().toDTO(e))
                .toList();
    }

    @Transactional
    public List<ProfesseurDTO> searchProfesseursList(String searchTerm) {
        List<Professeur> professeurs;
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            professeurs = professeurRepository.findAll();
        } else {
            String search = searchTerm.toLowerCase();
            professeurs = professeurRepository.findAll().stream()
                    .filter(p -> (p.getNom() != null && p.getNom().toLowerCase().contains(search)) ||
                            (p.getPrenom() != null && p.getPrenom().toLowerCase().contains(search)) ||
                            (p.getEmail() != null && p.getEmail().toLowerCase().contains(search)))
                    .toList();
        }
        return professeurs.stream()
                .map(ProfesseurDTO::toDTO)
                .toList();
    }

    @Transactional
    public List<GestionnaireDTO> searchGestionnaires(String searchTerm) throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        getProfesseurConnecte();

        Iterable<GestionnaireStage> iterableGestionnaires = gestionnaireRepository.findAll();
        List<GestionnaireStage> gestionnaires = StreamSupport.stream(iterableGestionnaires.spliterator(), false)
                .collect(Collectors.toList());

        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            String search = searchTerm.toLowerCase();
            gestionnaires = gestionnaires.stream()
                    .filter(g -> (g.getNom() != null && g.getNom().toLowerCase().contains(search)) ||
                            (g.getPrenom() != null && g.getPrenom().toLowerCase().contains(search)) ||
                            (g.getEmail() != null && g.getEmail().toLowerCase().contains(search)))
                    .toList();
        }

        return gestionnaires.stream()
                .map(GestionnaireDTO::toDTO)
                .toList();
    }

}
