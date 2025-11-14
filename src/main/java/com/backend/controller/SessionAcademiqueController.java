package com.backend.controller;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.SessionAcademiqueException;
import com.backend.service.DTO.ErrorResponse;
import com.backend.service.DTO.MessageRetourDTO;
import com.backend.service.DTO.SessionAcademiqueDTO;
import com.backend.service.SessionAcademiqueService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/OSEsessions")
public class SessionAcademiqueController {

    private final SessionAcademiqueService sessionAcademiqueService;

    public SessionAcademiqueController(SessionAcademiqueService sessionAcademiqueService) {
        this.sessionAcademiqueService = sessionAcademiqueService;
    }

    @GetMapping("/courante")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<?> getSessionCourante() {
        SessionAcademiqueDTO sessionCourante = sessionAcademiqueService.getSessionCourante();
        if (sessionCourante == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageRetourDTO(null, new ErrorResponse("SESSION_001", "Aucune session courante définie")));
        }
        return ResponseEntity.ok(sessionCourante);
    }

    @GetMapping("/actives")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<SessionAcademiqueDTO>> getSessionsActives() {
        List<SessionAcademiqueDTO> sessions = sessionAcademiqueService.getSessionsActives();
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/visibles")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<SessionAcademiqueDTO>> getSessionsVisibles() {
        List<SessionAcademiqueDTO> sessions = sessionAcademiqueService.getSessionsVisiblesPourUtilisateur();
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/toutes")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<?> getToutesLesSessions() {
        try {
            List<SessionAcademiqueDTO> sessions = sessionAcademiqueService.getToutesLesSessions();
            return ResponseEntity.ok(sessions);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        }
    }

    @PostMapping
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<?> creerSession(@RequestBody SessionAcademiqueDTO sessionDTO) {
        try {
            SessionAcademiqueDTO nouvelleSession = sessionAcademiqueService.creerSession(sessionDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(nouvelleSession);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (SessionAcademiqueException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageRetourDTO(null, new ErrorResponse("SESSION_002", e.getMessage())));
        }
    }

    @PutMapping("/{sessionId}/activer")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<?> changerSessionCourante(@PathVariable Long sessionId) {
        try {
            SessionAcademiqueDTO sessionActivee = sessionAcademiqueService.changerSessionCourante(sessionId);
            return ResponseEntity.ok(sessionActivee);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (SessionAcademiqueException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageRetourDTO(null, new ErrorResponse("SESSION_003", e.getMessage())));
        }
    }

    @PutMapping("/{sessionId}/toggle-active")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<?> toggleSessionActive(@PathVariable Long sessionId) {
        try {
            SessionAcademiqueDTO sessionModifiee = sessionAcademiqueService.toggleSessionActive(sessionId);
            return ResponseEntity.ok(sessionModifiee);
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse(e.getErrorCode().getCode(), e.getMessage())));
        } catch (SessionAcademiqueException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageRetourDTO(null, new ErrorResponse("SESSION_004", e.getMessage())));
        }
    }

    @PostMapping("/initialiser")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<?> initialiserSessions() {
        try {
            sessionAcademiqueService.initialiserSessionsParDefaut();
            return ResponseEntity.ok(new MessageRetourDTO("Sessions initialisées avec succès", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageRetourDTO(null, new ErrorResponse("SESSION_005", "Erreur lors de l'initialisation des sessions")));
        }
    }
}