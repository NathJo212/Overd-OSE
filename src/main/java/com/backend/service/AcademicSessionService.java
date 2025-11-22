package com.backend.service;

import com.backend.modele.AcademicSession;
import com.backend.modele.AcademicSession.AcademicYear;
import com.backend.modele.AcademicSession.Session;
import com.backend.service.DTO.AcademicSessionDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Service pour gérer les sessions académiques
 */
@Service
public class AcademicSessionService {

    /**
     * Retourne l'année académique courante
     */
    public AcademicYear getCurrentAcademicYear() {
        return AcademicSession.getCurrentAcademicYear();
    }

    /**
     * Retourne la session courante
     */
    public Session getCurrentSession() {
        return AcademicSession.getCurrentSession();
    }

    /**
     * Retourne la clé de la session courante (ex: "HIVER_2025")
     */
    public String getCurrentSessionKey() {
        Session currentSession = getCurrentSession();
        int currentYear = LocalDate.now().getYear();
        return currentSession.name() + "_" + currentYear;
    }

    /**
     * Retourne la liste de toutes les sessions académiques disponibles
     * Format: Automne 2024, Hiver 2025, Été 2025, etc.
     * Ordre: Plus récent en premier
     */
    public List<AcademicSessionDTO> getAvailableSessions() {
        List<AcademicSessionDTO> sessions = new ArrayList<>();
        
        // On commence en 2022 et on va jusqu'à l'année courante + 1
        int startYear = 2022;
        int currentYear = LocalDate.now().getYear();
        int endYear = currentYear + 1;

        String currentSessionKey = getCurrentSessionKey();

        // Générer toutes les sessions de startYear à endYear
        for (int year = startYear; year <= endYear; year++) {
            // Pour chaque année, ajouter les 3 sessions (Hiver, Été, Automne)
            // Ordre chronologique : Hiver (jan-mai), Été (juin-juil), Automne (août-déc)
            for (Session session : new Session[]{Session.HIVER, Session.ETE, Session.AUTOMNE}) {
                String sessionKey = session.name() + "_" + year;
                boolean isCurrent = sessionKey.equals(currentSessionKey);
                sessions.add(AcademicSessionDTO.fromSessionAndYear(session, year, isCurrent));
            }
        }

        // Inverser pour avoir les plus récentes en premier
        Collections.reverse(sessions);

        return sessions;
    }

    /**
     * Retourne la session à utiliser selon le rôle et le paramètre fourni
     * 
     * @param requestedSession La session demandée (null pour la session courante)
     * @param allowPastSessions Si true, autorise l'accès aux sessions passées
     * @return La clé de session à utiliser
     */
    public String getSessionForRole(String requestedSession, boolean allowPastSessions) {
        // Si l'accès aux sessions passées n'est pas autorisé, on retourne toujours la session courante
        if (!allowPastSessions) {
            return getCurrentSessionKey();
        }

        // Si aucune session n'est demandée, on retourne la session courante
        if (requestedSession == null || requestedSession.isEmpty()) {
            return getCurrentSessionKey();
        }

        // Sinon, on retourne la session demandée
        return requestedSession;
    }
}


