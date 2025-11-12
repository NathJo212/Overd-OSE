package com.backend.persistence;

import com.backend.modele.Session;
import com.backend.modele.SessionAcademique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SessionAcademiqueRepository extends JpaRepository<SessionAcademique, Long> {
    Optional<SessionAcademique> findByEstCouranteTrue();

    List<SessionAcademique> findByEstActiveTrue();

    List<SessionAcademique> findByEstActiveTrueOrderByAnneeDescSessionAsc();

    Optional<SessionAcademique> findBySessionAndAnnee(Session session, String annee);

    boolean existsBySessionAndAnnee(Session session, String annee);

    List<SessionAcademique> findByAnnee(String annee);

    List<SessionAcademique> findAllByOrderByAnneeDescSessionAsc();

    List<SessionAcademique> findByEstActiveTrueAndEstCouranteTrueOrEstActiveTrueOrderByAnneeAscSessionAsc();
}