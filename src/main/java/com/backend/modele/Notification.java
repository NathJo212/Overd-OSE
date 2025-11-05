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

    // clé i18n (ex: convocation.created)
    private String messageKey;

    private String messageParam;

    @Column(nullable = false)
    private boolean lu = false;

    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    public Notification(Utilisateur utilisateur) {
        this.utilisateur = utilisateur;
        this.lu = false;
        this.dateCreation = LocalDateTime.now();
    }

}