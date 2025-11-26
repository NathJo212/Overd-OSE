package com.backend.service;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.AuthenticationException;
import com.backend.Exceptions.UtilisateurPasTrouveException;
import com.backend.config.JwtTokenProvider;
import com.backend.modele.*;
import com.backend.persistence.*;
import com.backend.service.DTO.*;
import jakarta.transaction.Transactional;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class UtilisateurService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UtilisateurRepository utilisateurRepository;
    private final EtudiantRepository etudiantRepository;
    private final EmployeurRepository employeurRepository;
    private final ProfesseurRepository professeurRepository;
    private final GestionnaireRepository gestionnaireRepository;

    public UtilisateurService(AuthenticationManager authenticationManager, JwtTokenProvider jwtTokenProvider, UtilisateurRepository utilisateurRepository, EtudiantRepository etudiantRepository, EmployeurRepository employeurRepository, ProfesseurRepository professeurRepository, GestionnaireRepository gestionnaireRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.utilisateurRepository = utilisateurRepository;
        this.etudiantRepository = etudiantRepository;
        this.employeurRepository = employeurRepository;
        this.professeurRepository = professeurRepository;
        this.gestionnaireRepository = gestionnaireRepository;
    }

    @Transactional
    public AuthResponseDTO authentifierUtilisateur(String email, String password) throws AuthenticationException {
        try {
            // Utilise Spring Security pour l'authentification
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );

            // Génère le token JWT
            String token = jwtTokenProvider.generateToken(authentication);

            // Récupère l'utilisateur pour créer le DTO
            Optional<Utilisateur> utilisateurOptional = utilisateurRepository.findByEmail(email);
            if (utilisateurOptional.isEmpty()) {
                throw new AuthenticationException();
            }

            Utilisateur utilisateur = utilisateurOptional.get();
            UtilisateurDTO utilisateurDTO = UtilisateurDTO.toDTO(utilisateur);

            return new AuthResponseDTO(token, utilisateurDTO, null);

        } catch (Exception e) {
            throw new AuthenticationException();
        }
    }

    @Transactional
    public void logout(String token) {
        jwtTokenProvider.logout(token);
    }

    @Transactional
    public List<String> getAllProgrammes() {
        return Stream.of(ProgrammeDTO.values())
                .map(ProgrammeDTO::name)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> searchAllUsers(String searchTerm) throws ActionNonAutoriseeException {
        verifierAccesRecherche();

        Map<String, Object> results = new HashMap<>();

        results.put("etudiants", searchEtudiants(searchTerm));
        results.put("employeurs", searchEmployeurs(searchTerm));
        results.put("professeurs", searchProfesseurs(searchTerm));
        results.put("gestionnaires", searchGestionnaires(searchTerm));

        return results;
    }

    @Transactional
    public Map<String, Object> searchUsersByCategory(String searchTerm, String category) throws ActionNonAutoriseeException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new ActionNonAutoriseeException();
        }

        boolean isEtudiant = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ETUDIANT"));

        Map<String, Object> results = new HashMap<>();

        switch (category.toUpperCase()) {
            case "ALL":
                if (!isEtudiant) {
                    results.put("etudiants", searchEtudiants(searchTerm));
                }
                results.put("employeurs", searchEmployeurs(searchTerm));
                results.put("professeurs", searchProfesseurs(searchTerm));
                results.put("gestionnaires", searchGestionnaires(searchTerm));
                break;
            case "ETUDIANT":
                if (isEtudiant) {
                    throw new ActionNonAutoriseeException();
                }
                results.put("etudiants", searchEtudiants(searchTerm));
                break;
            case "EMPLOYEUR":
                results.put("employeurs", searchEmployeurs(searchTerm));
                break;
            case "PROFESSEUR":
                results.put("professeurs", searchProfesseurs(searchTerm));
                break;
            case "GESTIONNAIRE":
                results.put("gestionnaires", searchGestionnaires(searchTerm));
                break;
            default:
                throw new IllegalArgumentException("Invalid category: " + category);
        }

        return results;
    }

    private void verifierAccesRecherche() throws ActionNonAutoriseeException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Check if user is authenticated
        if (auth == null || !auth.isAuthenticated()) {
            throw new ActionNonAutoriseeException();
        }

        // Block ETUDIANT role from accessing search
        boolean isEtudiant = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ETUDIANT"));

        if (isEtudiant) {
            throw new ActionNonAutoriseeException();
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

    private List<EtudiantDTO> searchEtudiants(String searchTerm) {
        int anneeAcademiqueCourante = getAnneeAcademiqueCourante();

        List<Etudiant> etudiants;
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            etudiants = (List<Etudiant>) etudiantRepository.findAll();
        } else {
            String search = searchTerm.toLowerCase();
            etudiants = ((List<Etudiant>) etudiantRepository.findAll()).stream()
                    .filter(e -> (e.getNom() != null && e.getNom().toLowerCase().contains(search)) ||
                            (e.getPrenom() != null && e.getPrenom().toLowerCase().contains(search)) ||
                            (e.getEmail() != null && e.getEmail().toLowerCase().contains(search)))
                    .collect(Collectors.toList());
        }
        return etudiants.stream()
                .filter(e -> e.getAnnee() == anneeAcademiqueCourante)
                .map(e -> new EtudiantDTO().toDTO(e))
                .collect(Collectors.toList());
    }

    private List<EmployeurDTO> searchEmployeurs(String searchTerm) {
        List<Employeur> employeurs;
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            employeurs = (List<Employeur>) employeurRepository.findAll();
        } else {
            String search = searchTerm.toLowerCase();
            employeurs = ((List<Employeur>) employeurRepository.findAll()).stream()
                    .filter(e -> (e.getNomEntreprise() != null && e.getNomEntreprise().toLowerCase().contains(search)) ||
                            (e.getEmail() != null && e.getEmail().toLowerCase().contains(search)) ||
                            (e.getContact() != null && e.getContact().toLowerCase().contains(search)))
                    .collect(Collectors.toList());
        }
        return employeurs.stream()
                .map(e -> new EmployeurDTO().toDTO(e))
                .collect(Collectors.toList());
    }

    private List<ProfesseurDTO> searchProfesseurs(String searchTerm) {
        List<Professeur> professeurs;
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            professeurs = professeurRepository.findAll();
        } else {
            String search = searchTerm.toLowerCase();
            professeurs = professeurRepository.findAll().stream()
                    .filter(p -> (p.getNom() != null && p.getNom().toLowerCase().contains(search)) ||
                            (p.getPrenom() != null && p.getPrenom().toLowerCase().contains(search)) ||
                            (p.getEmail() != null && p.getEmail().toLowerCase().contains(search)))
                    .collect(Collectors.toList());
        }
        return professeurs.stream()
                .map(ProfesseurDTO::toDTO)
                .collect(Collectors.toList());
    }

    private List<GestionnaireDTO> searchGestionnaires(String searchTerm) {
        List<GestionnaireStage> gestionnaires;
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            gestionnaires = (List<GestionnaireStage>) gestionnaireRepository.findAll();
        } else {
            String search = searchTerm.toLowerCase();
            gestionnaires = ((List<GestionnaireStage>) gestionnaireRepository.findAll()).stream()
                    .filter(g -> (g.getNom() != null && g.getNom().toLowerCase().contains(search)) ||
                            (g.getPrenom() != null && g.getPrenom().toLowerCase().contains(search)) ||
                            (g.getEmail() != null && g.getEmail().toLowerCase().contains(search)))
                    .collect(Collectors.toList());
        }
        return gestionnaires.stream()
                .map(GestionnaireDTO::toDTO)
                .collect(Collectors.toList());
    }

    // Individual info methods
    @Transactional
    public EtudiantDTO getEtudiantInfo(Long etudiantId) throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        verifierAccesRecherche();
        Etudiant etudiant = etudiantRepository.findById(etudiantId)
                .orElseThrow(UtilisateurPasTrouveException::new);
        return new EtudiantDTO().toDTO(etudiant);
    }

    @Transactional
    public EmployeurDTO getEmployeurInfo(Long employeurId) throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        verifierAccesRecherche();
        Employeur employeur = employeurRepository.findById(employeurId)
                .orElseThrow(UtilisateurPasTrouveException::new);
        return new EmployeurDTO().toDTO(employeur);
    }

    @Transactional
    public ProfesseurDTO getProfesseurInfo(Long professeurId) throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        verifierAccesRecherche();
        Professeur professeur = professeurRepository.findById(professeurId)
                .orElseThrow(UtilisateurPasTrouveException::new);
        return ProfesseurDTO.toDTO(professeur);
    }

    @Transactional
    public GestionnaireDTO getGestionnaireInfo(Long gestionnaireId) throws ActionNonAutoriseeException, UtilisateurPasTrouveException {
        verifierAccesRecherche();
        GestionnaireStage gestionnaire = gestionnaireRepository.findById(gestionnaireId)
                .orElseThrow(UtilisateurPasTrouveException::new);
        return GestionnaireDTO.toDTO(gestionnaire);
    }


}