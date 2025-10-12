package com.backend.service;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.Exceptions.UtilisateurPasTrouveException;
import com.backend.modele.Candidature;
import com.backend.modele.Etudiant;
import com.backend.modele.Offre;
import com.backend.modele.Programme;
import com.backend.persistence.CandidatureRepository;
import com.backend.persistence.EtudiantRepository;
import com.backend.persistence.UtilisateurRepository;
import com.backend.service.DTO.*;
import com.backend.persistence.OffreRepository;
import com.backend.util.EncryptageCV;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class EtudiantService {

    private final PasswordEncoder passwordEncoder;
    private final EtudiantRepository etudiantRepository;
    private final OffreRepository offreRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EncryptageCV encryptageCV;
    private final CandidatureRepository candidatureRepository;

    public EtudiantService(PasswordEncoder passwordEncoder, EtudiantRepository etudiantRepository, OffreRepository offreRepository, UtilisateurRepository  utilisateurRepository, EncryptageCV encryptageCV, CandidatureRepository candidatureRepository) {
        this.passwordEncoder = passwordEncoder;
        this.etudiantRepository = etudiantRepository;
        this.offreRepository = offreRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.encryptageCV = encryptageCV;
        this.candidatureRepository = candidatureRepository;
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
            throw new RuntimeException("CV non trouvé pour l'étudiant");
        }
        String cvChiffre = new String(etudiant.getCv());
        byte[] cvDechiffre = encryptageCV.dechiffrer(cvChiffre);
        return new CvDTO(cvDechiffre);
    }

    public void verifierFichierPdf(MultipartFile fichier) {
        if (!"application/pdf".equalsIgnoreCase(fichier.getContentType())) {
            throw new IllegalArgumentException("Le fichier doit être au format PDF.");
        }
        if (!fichier.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("L'extension du fichier doit être .pdf.");
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
            throw new IllegalStateException("Votre CV doit être approuvé avant de postuler");
        }

        Offre offre = offreRepository.findById(offreId)
                .orElseThrow(() -> new IllegalArgumentException("Offre non trouvée"));

        if (offre.getStatutApprouve() != Offre.StatutApprouve.APPROUVE) {
            throw new IllegalStateException("Cette offre n'est pas disponible pour les candidatures");
        }

        if (offre.getDateLimite() != null && LocalDate.now().isAfter(offre.getDateLimite())) {
            throw new IllegalStateException("La date limite de candidature est dépassée");
        }

        if (candidatureRepository.existsByEtudiantAndOffre(etudiant, offre)) {
            throw new IllegalStateException("Vous avez déjà postulé à cette offre");
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
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Etudiant etudiant = getEtudiantConnecte();

        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new IllegalArgumentException("Candidature non trouvée"));

        if (!candidature.getEtudiant().getId().equals(etudiant.getId())) {
            throw new ActionNonAutoriseeException();
        }

        if (etudiant.getCv() == null || etudiant.getCv().length == 0) {
            throw new IllegalArgumentException("CV non trouvé pour cette candidature");
        }

        try {
            String cvChiffre = new String(etudiant.getCv());
            return encryptageCV.dechiffrer(cvChiffre);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors du déchiffrement du CV", e);
        }
    }

    @Transactional
    public byte[] getLettreMotivationPourCandidature(Long candidatureId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Etudiant etudiant = getEtudiantConnecte();

        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new IllegalArgumentException("Candidature non trouvée"));

        if (!candidature.getEtudiant().getId().equals(etudiant.getId())) {
            throw new ActionNonAutoriseeException();
        }

        if (candidature.getLettreMotivation() == null || candidature.getLettreMotivation().length == 0) {
            throw new IllegalArgumentException("Lettre de motivation non trouvée pour cette candidature");
        }

        try {
            String lettreChiffree = new String(candidature.getLettreMotivation(), StandardCharsets.UTF_8);
            return encryptageCV.dechiffrer(lettreChiffree);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors du déchiffrement de la lettre de motivation", e);
        }
    }

    @Transactional
    public void retirerCandidature(Long candidatureId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Etudiant etudiant = getEtudiantConnecte();

        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new IllegalArgumentException("Candidature non trouvée"));

        if (!candidature.getEtudiant().getId().equals(etudiant.getId())) {
            throw new ActionNonAutoriseeException();
        }

        if (candidature.getStatut() != Candidature.StatutCandidature.EN_ATTENTE) {
            throw new IllegalStateException("Seules les candidatures en attente peuvent être retirées");
        }

        candidature.setStatut(Candidature.StatutCandidature.RETIREE);
        candidatureRepository.save(candidature);
    }

    public boolean aPostuleOffre(Long offreId)
            throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        Etudiant etudiant = getEtudiantConnecte();
        Offre offre = offreRepository.findById(offreId)
                .orElseThrow(() -> new IllegalArgumentException("Offre non trouvée"));
        return candidatureRepository.existsByEtudiantAndOffre(etudiant, offre);
    }

}
