package com.backend.controller;

import com.backend.service.AcademicSessionService;
import com.backend.service.DTO.AcademicSessionDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur pour gérer les sessions académiques
 */
@RestController
@RequestMapping("/OSEacademicSession")
public class AcademicSessionController {

    private final AcademicSessionService academicSessionService;

    public AcademicSessionController(AcademicSessionService academicSessionService) {
        this.academicSessionService = academicSessionService;
    }

    /**
     * Obtenir la liste de toutes les sessions académiques disponibles
     */
    @GetMapping("/sessions")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<AcademicSessionDTO>> getAvailableSessions() {
        try {
            List<AcademicSessionDTO> sessions = academicSessionService.getAvailableSessions();
            return ResponseEntity.ok(sessions);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Obtenir la session courante
     */
    @GetMapping("/current")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<String> getCurrentSessionKey() {
        try {
            String currentKey = academicSessionService.getCurrentSessionKey();
            return ResponseEntity.ok(currentKey);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}


