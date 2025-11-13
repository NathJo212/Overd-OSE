package com.backend.service;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.SessionAcademiqueException;
import com.backend.modele.Session;
import com.backend.modele.SessionAcademique;
import com.backend.persistence.SessionAcademiqueRepository;
import com.backend.persistence.UtilisateurRepository;
import com.backend.service.DTO.SessionAcademiqueDTO;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SessionAcademiqueService {

    private final SessionAcademiqueRepository sessionAcademiqueRepository;
    private final UtilisateurRepository utilisateurRepository;

    public SessionAcademiqueService(SessionAcademiqueRepository sessionAcademiqueRepository,
                                    UtilisateurRepository utilisateurRepository) {
        this.sessionAcademiqueRepository = sessionAcademiqueRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    private void verifierGestionnaireConnecte() throws ActionNonAutoriseeException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ActionNonAutoriseeException();
        }

        boolean isGestionnaire = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_GESTIONNAIRE"));

        if (!isGestionnaire) {
            throw new ActionNonAutoriseeException();
        }
    }

    @Transactional
    public SessionAcademiqueDTO getSessionCourante() {
        return sessionAcademiqueRepository.findByEstCouranteTrue()
                .map(session -> new SessionAcademiqueDTO().toDTO(session))
                .orElse(null);
    }

    @Transactional
    public List<SessionAcademiqueDTO> getSessionsActives() {
        List<SessionAcademique> sessions = sessionAcademiqueRepository.findByEstActiveTrueOrderByAnneeDescSessionAsc();
        return sessions.stream()
                .map(session -> new SessionAcademiqueDTO().toDTO(session))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<SessionAcademiqueDTO> getToutesLesSessions() throws ActionNonAutoriseeException {
        verifierGestionnaireConnecte();
        List<SessionAcademique> sessions = sessionAcademiqueRepository.findAllByOrderByAnneeDescSessionAsc();
        return sessions.stream()
                .map(session -> new SessionAcademiqueDTO().toDTO(session))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<SessionAcademiqueDTO> getSessionsVisiblesPourUtilisateur() {
        LocalDate aujourdhui = LocalDate.now();
        List<SessionAcademique> toutesSessionsActives = sessionAcademiqueRepository.findByEstActiveTrue();

        // Filtre : garder seulement courante + futures
        List<SessionAcademique> sessionsVisibles = toutesSessionsActives.stream()
                .filter(session -> session.isEstCourante() || session.estFuture(aujourdhui) || session.estEnCours(aujourdhui))
                .collect(Collectors.toList());

        return sessionsVisibles.stream()
                .map(session -> new SessionAcademiqueDTO().toDTO(session))
                .collect(Collectors.toList());
    }

    @Transactional
    public SessionAcademiqueDTO creerSession(SessionAcademiqueDTO dto)
            throws ActionNonAutoriseeException, SessionAcademiqueException {
        verifierGestionnaireConnecte();

        // Validation
        if (dto.getSession() == null || dto.getAnnee() == null) {
            throw new SessionAcademiqueException("La session et l'année sont obligatoires");
        }

        if (dto.getDateDebut() == null || dto.getDateFin() == null) {
            throw new SessionAcademiqueException("Les dates de début et fin sont obligatoires");
        }

        if (dto.getDateFin().isBefore(dto.getDateDebut())) {
            throw new SessionAcademiqueException("La date de fin doit être après la date de début");
        }

        Session session;
        try {
            session = Session.valueOf(dto.getSession().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new SessionAcademiqueException("Session invalide: " + dto.getSession());
        }

        // Vérifier que la session n'existe pas déjà
        if (sessionAcademiqueRepository.existsBySessionAndAnnee(session, dto.getAnnee())) {
            throw new SessionAcademiqueException("Cette session existe déjà: " + dto.getSession() + " " + dto.getAnnee());
        }

        // Créer la nouvelle session
        SessionAcademique nouvelleSession = new SessionAcademique(
                session,
                dto.getAnnee(),
                dto.getDateDebut(),
                dto.getDateFin()
        );

        nouvelleSession.setEstActive(true);
        nouvelleSession.setEstCourante(false); // Par défaut, pas courante

        SessionAcademique savedSession = sessionAcademiqueRepository.save(nouvelleSession);
        return new SessionAcademiqueDTO().toDTO(savedSession);
    }

    @Transactional
    public SessionAcademiqueDTO changerSessionCourante(Long sessionId)
            throws ActionNonAutoriseeException, SessionAcademiqueException {
        verifierGestionnaireConnecte();

        SessionAcademique nouvelleSessionCourante = sessionAcademiqueRepository.findById(sessionId)
                .orElseThrow(() -> new SessionAcademiqueException("Session non trouvée"));

        sessionAcademiqueRepository.findByEstCouranteTrue()
                .ifPresent(ancienneCourante -> {
                    ancienneCourante.setEstCourante(false);
                    sessionAcademiqueRepository.save(ancienneCourante);
                });

        nouvelleSessionCourante.setEstCourante(true);
        nouvelleSessionCourante.setEstActive(true);
        SessionAcademique saved = sessionAcademiqueRepository.save(nouvelleSessionCourante);

        return new SessionAcademiqueDTO().toDTO(saved);
    }

    @Transactional
    public SessionAcademiqueDTO toggleSessionActive(Long sessionId)
            throws ActionNonAutoriseeException, SessionAcademiqueException {
        verifierGestionnaireConnecte();

        SessionAcademique session = sessionAcademiqueRepository.findById(sessionId)
                .orElseThrow(() -> new SessionAcademiqueException("Session non trouvée"));

        // Ne pas permettre de désactiver la session courante
        if (session.isEstCourante() && session.isEstActive()) {
            throw new SessionAcademiqueException("Impossible de désactiver la session courante");
        }

        session.setEstActive(!session.isEstActive());
        SessionAcademique saved = sessionAcademiqueRepository.save(session);

        return new SessionAcademiqueDTO().toDTO(saved);
    }

    public boolean estSessionAccessiblePourUtilisateur(String session, String annee) {
        Session sessionEnum;
        try {
            sessionEnum = Session.valueOf(session.toUpperCase());
        } catch (IllegalArgumentException e) {
            return false;
        }

        return sessionAcademiqueRepository.findBySessionAndAnnee(sessionEnum, annee)
                .map(s -> {
                    LocalDate aujourdhui = LocalDate.now();
                    return s.isEstCourante() || s.estFuture(aujourdhui) || s.estEnCours(aujourdhui);
                })
                .orElse(false);
    }

    @Transactional
    public void initialiserSessionsParDefaut() {
        if (sessionAcademiqueRepository.count() > 0) {
            return;
        }

        LocalDate debutAutomne2025 = LocalDate.of(2025, 9, 1);
        LocalDate finAutomne2025 = LocalDate.of(2025, 12, 20);

        LocalDate debutHiver2026 = LocalDate.of(2026, 1, 6);
        LocalDate finHiver2026 = LocalDate.of(2026, 4, 30);

        LocalDate debutEte2026 = LocalDate.of(2026, 5, 1);
        LocalDate finEte2026 = LocalDate.of(2026, 8, 31);

        SessionAcademique automne2025 = new SessionAcademique(
                Session.AUTOMNE, "2025", debutAutomne2025, finAutomne2025
        );
        automne2025.setEstCourante(true);
        automne2025.setEstActive(true);

        SessionAcademique hiver2026 = new SessionAcademique(
                Session.HIVER, "2026", debutHiver2026, finHiver2026
        );
        hiver2026.setEstCourante(false);
        hiver2026.setEstActive(true);

        SessionAcademique ete2026 = new SessionAcademique(
                Session.ETE, "2026", debutEte2026, finEte2026
        );
        ete2026.setEstCourante(false);
        ete2026.setEstActive(true);

        sessionAcademiqueRepository.save(automne2025);
        sessionAcademiqueRepository.save(hiver2026);
        sessionAcademiqueRepository.save(ete2026);
    }
}