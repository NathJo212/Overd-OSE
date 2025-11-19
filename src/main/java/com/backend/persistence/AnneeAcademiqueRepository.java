package com.backend.persistence;

import com.backend.modele.AnneeAcademique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnneeAcademiqueRepository extends JpaRepository<AnneeAcademique, Long> {

    /**
     * Trouve l'année académique courante basée sur la date actuelle
     */
    @Query("SELECT a FROM AnneeAcademique a WHERE :date BETWEEN a.dateDebut AND a.dateFin")
    Optional<AnneeAcademique> findByDate(@Param("date") LocalDate date);

    /**
     * Trouve une année académique par son année de début
     */
    Optional<AnneeAcademique> findByAnneeDebut(Integer anneeDebut);

    /**
     * Trouve toutes les années académiques triées par date de début décroissante
     */
    List<AnneeAcademique> findAllByOrderByDateDebutDesc();

    /**
     * Vérifie si une année académique existe déjà pour une année de début donnée
     */
    boolean existsByAnneeDebut(Integer anneeDebut);

    /**
     * Trouve toutes les années passées (date de fin avant aujourd'hui)
     */
    @Query("SELECT a FROM AnneeAcademique a WHERE a.dateFin < :date ORDER BY a.dateDebut DESC")
    List<AnneeAcademique> findAnneesPassees(@Param("date") LocalDate date);

    /**
     * Trouve toutes les années futures (date de début après aujourd'hui)
     */
    @Query("SELECT a FROM AnneeAcademique a WHERE a.dateDebut > :date ORDER BY a.dateDebut ASC")
    List<AnneeAcademique> findAnneesFutures(@Param("date") LocalDate date);
}

