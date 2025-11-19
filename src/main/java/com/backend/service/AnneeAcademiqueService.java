package com.backend.service;

import com.backend.modele.AnneeAcademique;
import com.backend.persistence.AnneeAcademiqueRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class AnneeAcademiqueService {

    private final AnneeAcademiqueRepository anneeAcademiqueRepository;

    public AnneeAcademiqueService(AnneeAcademiqueRepository anneeAcademiqueRepository) {
        this.anneeAcademiqueRepository = anneeAcademiqueRepository;
    }

    /**
     * Récupère l'année académique courante basée sur la date actuelle
     */
    public AnneeAcademique getAnneeCourante() {
        return anneeAcademiqueRepository.findByDate(LocalDate.now())
                .orElse(null);
    }

    /**
     * Récupère une année académique par son année de début
     */
    public Optional<AnneeAcademique> getAnneeByAnneeDebut(Integer anneeDebut) {
        return anneeAcademiqueRepository.findByAnneeDebut(anneeDebut);
    }

    /**
     * Récupère toutes les années académiques
     */
    public List<AnneeAcademique> getAllAnnees() {
        return anneeAcademiqueRepository.findAllByOrderByDateDebutDesc();
    }

    /**
     * Récupère toutes les années passées
     */
    public List<AnneeAcademique> getAnneesPassees() {
        return anneeAcademiqueRepository.findAnneesPassees(LocalDate.now());
    }

    /**
     * Récupère toutes les années futures
     */
    public List<AnneeAcademique> getAnneesFutures() {
        return anneeAcademiqueRepository.findAnneesFutures(LocalDate.now());
    }

    /**
     * Crée une nouvelle année académique
     * L'année académique commence le 21 août de anneeDebut et se termine le 20 août de anneeFin
     */
    @Transactional
    public AnneeAcademique creerAnneeAcademique(Integer anneeDebut) {
        if (anneeAcademiqueRepository.existsByAnneeDebut(anneeDebut)) {
            throw new IllegalArgumentException("Une année académique existe déjà pour l'année " + anneeDebut);
        }

        Integer anneeFin = anneeDebut + 1;
        LocalDate dateDebut = LocalDate.of(anneeDebut, 8, 21); // 21 août
        LocalDate dateFin = LocalDate.of(anneeFin, 8, 20); // 20 août année suivante

        AnneeAcademique anneeAcademique = new AnneeAcademique(anneeDebut, anneeFin, dateDebut, dateFin);
        return anneeAcademiqueRepository.save(anneeAcademique);
    }

    /**
     * Détermine automatiquement l'année académique basée sur une date
     * Si aucune année n'existe, retourne null
     */
    public AnneeAcademique determinerAnneeAcademique(LocalDate date) {
        return anneeAcademiqueRepository.findByDate(date).orElse(null);
    }

    /**
     * Initialise les années académiques de base si elles n'existent pas
     */
    @Transactional
    public void initialiserAnneesAcademiques() {
        // Créer quelques années académiques si elles n'existent pas
        int anneeActuelle = LocalDate.now().getYear();
        
        // Année précédente
        if (!anneeAcademiqueRepository.existsByAnneeDebut(anneeActuelle - 2)) {
            creerAnneeAcademique(anneeActuelle - 2);
        }
        
        if (!anneeAcademiqueRepository.existsByAnneeDebut(anneeActuelle - 1)) {
            creerAnneeAcademique(anneeActuelle - 1);
        }

        // Année courante
        if (!anneeAcademiqueRepository.existsByAnneeDebut(anneeActuelle)) {
            creerAnneeAcademique(anneeActuelle);
        }

        // Année suivante
        if (!anneeAcademiqueRepository.existsByAnneeDebut(anneeActuelle + 1)) {
            creerAnneeAcademique(anneeActuelle + 1);
        }
    }

    /**
     * Vérifie si une année académique existe
     */
    public boolean anneeExiste(Integer anneeDebut) {
        return anneeAcademiqueRepository.existsByAnneeDebut(anneeDebut);
    }
}

