package com.backend.service.DTO;

import com.backend.modele.EvaluationEtudiantParEmployeur;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationDTO {
    private Long id;
    private Long ententeId;
    private Long etudiantId;
    private Long employeurId;
    private String pdfBase64;
    private LocalDateTime dateEvaluation;
    
    // Informations du stagiaire
    private String etudiantNom;
    private String etudiantPrenom;
    private String etudiantEmail;
    
    // Informations du stage
    private String offreTitre;
    private String dateDebut;
    private String dateFin;

    public EvaluationDTO toDTO(EvaluationEtudiantParEmployeur e) {
        EvaluationDTO dto = new EvaluationDTO();
        dto.setId(e.getId());
        dto.setEntenteId(e.getEntente() != null ? e.getEntente().getId() : null);
        dto.setEtudiantId(e.getEtudiant() != null ? e.getEtudiant().getId() : null);
        dto.setEmployeurId(e.getEmployeur() != null ? e.getEmployeur().getId() : null);
        dto.setPdfBase64(e.getPdfBase64());
        dto.setDateEvaluation(e.getDateEvaluation());
        
        // Enrichir avec les informations du stagiaire
        if (e.getEtudiant() != null) {
            dto.setEtudiantNom(e.getEtudiant().getNom());
            dto.setEtudiantPrenom(e.getEtudiant().getPrenom());
            dto.setEtudiantEmail(e.getEtudiant().getEmail());
        }
        
        // Enrichir avec les informations du stage depuis l'entente
        if (e.getEntente() != null) {
            if (e.getEntente().getOffre() != null) {
                dto.setOffreTitre(e.getEntente().getOffre().getTitre());
            }
            dto.setDateDebut(e.getEntente().getDateDebut() != null ? e.getEntente().getDateDebut().toString() : null);
            dto.setDateFin(e.getEntente().getDateFin() != null ? e.getEntente().getDateFin().toString() : null);
        }
        
        return dto;
    }
}
