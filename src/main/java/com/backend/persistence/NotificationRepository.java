package com.backend.persistence;

import com.backend.modele.Notification;
import com.backend.modele.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findAllByUtilisateurAndLuFalseOrderByDateCreationDesc(Utilisateur utilisateur);
}

