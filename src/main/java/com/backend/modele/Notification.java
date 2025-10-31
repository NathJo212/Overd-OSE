package com.backend.modele;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Utilisateur utilisateur;

    @Column(length = 2000)
    private String message;

    // clé i18n (ex: convocation.created)
    private String messageKey;

    private String messageParam;

    // structured helper fields
    // id of a referenced entity (e.g., offre id)
    private Long referenceId;

    // type of referenced entity (e.g., OFFRE, ENTENTE)
    private String referenceType;

    // human friendly title for the notification (e.g., offer title)
    private String title;

    @Column(nullable = false)
    private boolean lu = false;

    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    public Notification(Utilisateur utilisateur, String message) {
        this.utilisateur = utilisateur;
        this.message = message;
        this.lu = false;
        this.dateCreation = LocalDateTime.now();
    }

}