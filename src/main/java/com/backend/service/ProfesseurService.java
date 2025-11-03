package com.backend.service;


import com.backend.Exceptions.*;
import com.backend.modele.Etudiant;
import com.backend.modele.Professeur;
import com.backend.persistence.EtudiantRepository;
import com.backend.persistence.ProfesseurRepository;
import com.backend.persistence.UtilisateurRepository;
import com.backend.service.DTO.EtudiantDTO;
import com.backend.util.EncryptageCV;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class ProfesseurService {

    private final ProfesseurRepository professeurRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final EtudiantRepository etudiantRepository;
    private final EncryptageCV encryptageCV;


    public ProfesseurService(ProfesseurRepository professeurRepository, UtilisateurRepository utilisateurRepository, PasswordEncoder passwordEncoder, EtudiantRepository etudiantRepository, EncryptageCV encryptageCV) {
        this.professeurRepository = professeurRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
        this.etudiantRepository = etudiantRepository;
        this.encryptageCV = encryptageCV;
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


}
