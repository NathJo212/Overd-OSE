package com.backend.controller;

import com.backend.Exceptions.ActionNonAutoriseeException;
import com.backend.Exceptions.ErrorCode;
import com.backend.modele.AnneeAcademique;
import com.backend.service.AnneeAcademiqueService;
import com.backend.service.DTO.AnneeAcademiqueDTO;
import com.backend.service.DTO.ErrorResponse;
import com.backend.service.DTO.MessageRetourDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/OSEAnneeAcademique")
public class AnneeAcademiqueController {

    private final AnneeAcademiqueService anneeAcademiqueService;

    public AnneeAcademiqueController(AnneeAcademiqueService anneeAcademiqueService) {
        this.anneeAcademiqueService = anneeAcademiqueService;
    }

    /**
     * Récupère l'année académique courante
     */
    @GetMapping("/courante")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<AnneeAcademiqueDTO> getAnneeCourante() {
        try {
            AnneeAcademique anneeCourante = anneeAcademiqueService.getAnneeCourante();
            if (anneeCourante == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(AnneeAcademiqueDTO.toDTO(anneeCourante));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupère toutes les années académiques (triées par date décroissante)
     */
    @GetMapping("/all")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<AnneeAcademiqueDTO>> getAllAnnees() {
        try {
            List<AnneeAcademique> annees = anneeAcademiqueService.getAllAnnees();
            List<AnneeAcademiqueDTO> dtos = annees.stream()
                    .map(AnneeAcademiqueDTO::toDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupère les années passées
     */
    @GetMapping("/passees")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<AnneeAcademiqueDTO>> getAnneesPassees() {
        try {
            List<AnneeAcademique> annees = anneeAcademiqueService.getAnneesPassees();
            List<AnneeAcademiqueDTO> dtos = annees.stream()
                    .map(AnneeAcademiqueDTO::toDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupère les années futures
     */
    @GetMapping("/futures")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<List<AnneeAcademiqueDTO>> getAnneesFutures() {
        try {
            List<AnneeAcademique> annees = anneeAcademiqueService.getAnneesFutures();
            List<AnneeAcademiqueDTO> dtos = annees.stream()
                    .map(AnneeAcademiqueDTO::toDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Crée une nouvelle année académique (réservé au gestionnaire)
     */
    @PostMapping("/creer")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> creerAnneeAcademique(@RequestParam Integer anneeDebut) {
        try {
            // Vérifier que l'utilisateur est un gestionnaire
            checkGestionnaireRole();

            AnneeAcademique annee = anneeAcademiqueService.creerAnneeAcademique(anneeDebut);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new MessageRetourDTO("Année académique " + annee.getLibelle() + " créée avec succès", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageRetourDTO(null, new ErrorResponse("ANNEE_EXISTS", e.getMessage())));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse("UNAUTHORIZED", "Seul un gestionnaire peut créer une année académique")));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageRetourDTO(null, new ErrorResponse(ErrorCode.UNKNOWN_ERROR.getCode(), e.getMessage())));
        }
    }

    /**
     * Initialise les années académiques de base (réservé au gestionnaire)
     */
    @PostMapping("/initialiser")
    @CrossOrigin(origins = "http://localhost:5173")
    public ResponseEntity<MessageRetourDTO> initialiserAnnees() {
        try {
            // Vérifier que l'utilisateur est un gestionnaire
            checkGestionnaireRole();

            anneeAcademiqueService.initialiserAnneesAcademiques();
            return ResponseEntity.ok(new MessageRetourDTO("Années académiques initialisées avec succès", null));
        } catch (ActionNonAutoriseeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageRetourDTO(null, new ErrorResponse("UNAUTHORIZED", "Seul un gestionnaire peut initialiser les années académiques")));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageRetourDTO(null, new ErrorResponse(ErrorCode.UNKNOWN_ERROR.getCode(), e.getMessage())));
        }
    }

    /**
     * Vérifie que l'utilisateur connecté est un gestionnaire
     */
    private void checkGestionnaireRole() throws ActionNonAutoriseeException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isGestionnaire = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("GESTIONNAIRE"));
        if (!isGestionnaire) {
            throw new ActionNonAutoriseeException();
        }
    }
}

