package com.backend.service;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.DateInvalideException;
import com.backend.Exceptions.EmailDejaUtiliseException;
import com.backend.Exceptions.MotPasseInvalideException;
import com.backend.config.JwtTokenProvider;
import com.backend.modele.Employeur;
import com.backend.modele.Offre;
import com.backend.modele.Programme;
import com.backend.persistence.EmployeurRepository;
import com.backend.persistence.OffreRepository;
import com.backend.service.DTO.AuthResponseDTO;
import com.backend.service.DTO.ProgrammeDTO;
import com.backend.service.DTO.OffreDTO;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class EmployeurService {

    private final PasswordEncoder passwordEncoder;
    private final EmployeurRepository employeurRepository;
    private final OffreRepository offreRepository;
    JwtTokenProvider jwtTokenProvider;

    @Autowired
    public EmployeurService(PasswordEncoder passwordEncoder, EmployeurRepository employeurRepository, OffreRepository offreRepository, JwtTokenProvider jwtTokenProvider) {
        this.passwordEncoder = passwordEncoder;
        this.employeurRepository = employeurRepository;
        this.offreRepository = offreRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public void creerEmployeur(String email, String password, String telephone, String nomEntreprise, String contact) throws MotPasseInvalideException, EmailDejaUtiliseException {
        boolean employeurExistant = employeurRepository.existsByEmail(email);
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
            throw new DateInvalideException("Date de fin ne peut pas être avant la date de début.");
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
}
