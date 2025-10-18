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

    // message libre (compatibilité ascendante) - peut être null, on préfère messageKey/messageParam
    @Column(length = 2000)
    private String message;

    // clé i18n (ex: convocation.created)
    private String messageKey;

    // paramètre simple pour la clé (ex: titre de l'offre)
    private String messageParam;

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