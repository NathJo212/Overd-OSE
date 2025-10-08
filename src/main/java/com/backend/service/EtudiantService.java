package com.backend.service;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.Exceptions.UtilisateurPasTrouveException;
import com.backend.modele.Etudiant;
import com.backend.modele.Offre;
import com.backend.modele.Programme;
import com.backend.persistence.EtudiantRepository;
import com.backend.service.DTO.CvDTO;
import com.backend.persistence.OffreRepository;
import com.backend.service.DTO.OffreDTO;
import com.backend.service.DTO.ProgrammeDTO;
import com.backend.util.EncryptageCV;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class EtudiantService {

    private final PasswordEncoder passwordEncoder;
    private final EtudiantRepository etudiantRepository;
    private final OffreRepository offreRepository;
    private final EncryptageCV encryptageCV;

    public EtudiantService(PasswordEncoder passwordEncoder, EtudiantRepository etudiantRepository, OffreRepository offreRepository,  EncryptageCV encryptageCV) {
        this.passwordEncoder = passwordEncoder;
        this.etudiantRepository = etudiantRepository;
        this.offreRepository = offreRepository;
        this.encryptageCV = encryptageCV;
    }

    @Transactional
    public void creerEtudiant(String email, String password, String telephone,
                              String prenom, String nom, ProgrammeDTO progEtude, String session, String annee) throws MotPasseInvalideException, EmailDejaUtiliseException {
        boolean etudiantExistant = etudiantRepository.existsByEmail(email);
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
}
