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
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class EtudiantService {

    private final PasswordEncoder passwordEncoder;
    private final EtudiantRepository etudiantRepository;
    private final OffreRepository offreRepository;

    public EtudiantService(PasswordEncoder passwordEncoder, EtudiantRepository etudiantRepository, OffreRepository offreRepository) {
        this.passwordEncoder = passwordEncoder;
        this.etudiantRepository = etudiantRepository;
        this.offreRepository = offreRepository;
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

    private SecretKey chargerCleDepuisKeyStore() throws Exception {
        String keystorePath = "keystore.jks";
        String keystorePassword = System.getenv("KEYSTORE_PASSWORD");
        String keyAlias = "cle_travail";
        KeyStore keyStore = KeyStore.getInstance("JCEKS");
        try (FileInputStream fis = new FileInputStream(keystorePath)) {
            keyStore.load(fis, keystorePassword.toCharArray());
        }
        KeyStore.PasswordProtection protection = new KeyStore.PasswordProtection(keystorePassword.toCharArray());
        KeyStore.SecretKeyEntry entry = (KeyStore.SecretKeyEntry) keyStore.getEntry(keyAlias, protection);
        return entry.getSecretKey();
    }

    private String chiffrer(byte[] data) throws Exception {
        SecretKey secretKey = chargerCleDepuisKeyStore();
        byte[] iv = new byte[12];
        SecureRandom secureRandom = new SecureRandom();
        secureRandom.nextBytes(iv);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec gcmSpec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);
        byte[] ciphertext = cipher.doFinal(data);

        // Encode IV et ciphertext en Base64, séparés par ;
        return Base64.getEncoder().encodeToString(iv) + ";" + Base64.getEncoder().encodeToString(ciphertext);
    }

    byte[] dechiffrer(String dataChiffre) throws Exception {
        SecretKey secretKey = chargerCleDepuisKeyStore();
        String[] parts = dataChiffre.split(";");
        byte[] iv = Base64.getDecoder().decode(parts[0]);
        byte[] ciphertext = Base64.getDecoder().decode(parts[1]);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec gcmSpec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);
        return cipher.doFinal(ciphertext);
    }

    @Transactional
    public void sauvegarderCvEtudiantConnecte(MultipartFile fichierCv) throws Exception {
        verifierFichierPdf(fichierCv);
        Etudiant etudiant = getEtudiantConnecte();
        byte[] cvBytes = fichierCv.getBytes();
        String cvChiffre = chiffrer(cvBytes); // stocker sous forme String
        etudiant.setCv(cvChiffre.getBytes()); // ou adapte le type dans ton modèle
        etudiantRepository.save(etudiant);
    }

    @Transactional
    public CvDTO getCvEtudiantConnecte() throws Exception {
        Etudiant etudiant = getEtudiantConnecte();
        if (etudiant.getCv() == null || etudiant.getCv().length == 0) {
            throw new RuntimeException("CV non trouvé pour l'étudiant");
        }
        String cvChiffre = new String(etudiant.getCv());
        byte[] cvDechiffre = dechiffrer(cvChiffre);
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
            throw new ActionNonAutoriseeException("Accès refusé : rôle étudiant requis");
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
