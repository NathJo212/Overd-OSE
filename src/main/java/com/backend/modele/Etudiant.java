package com.backend.modele;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Etudiant extends Utilisateur {

    private String nom;
    private String prenom;

    @Convert(converter = ProgrammeConverter.class)
    private Programme progEtude;

    private String annee;

    private byte[] cv;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_cv")
    private StatutCV statutCV = StatutCV.AUCUN;

    @Column(name = "message_refus_cv", length = 1000)
    private String messageRefusCV;

    public enum StatutCV {
        ATTENTE,
        APPROUVE,
        REFUSE,
        AUCUN
    }

    @ManyToOne
    private Professeur professeur;

    @OneToMany(mappedBy = "etudiant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Candidature> candidatures = new ArrayList<>();

    public Etudiant(String email, String password, String telephone, String prenom, String nom,
                    Programme progEtude) {
        super(email, password, telephone);
        this.nom = nom;
        this.prenom = prenom;
        this.progEtude = progEtude;

        // Définir l'année automatiquement en fonction du mois actuel
        this.annee = determinerAnnee();
    }

    /**
     * Détermine l'année académique en fonction du mois actuel.
     * Si nous sommes en août (mois 8) ou après, retourne l'année suivante.
     * Sinon, retourne l'année actuelle.
     */
    private String determinerAnnee() {
        LocalDate maintenant = LocalDate.now();
        int anneeActuelle = maintenant.getYear();
        int moisActuel = maintenant.getMonthValue(); // 1-12 (1 = janvier, 8 = août)

        // Si nous sommes en août (8) ou après, utiliser l'année suivante
        if (moisActuel >= 8) {
            return String.valueOf(anneeActuelle + 1);
        } else {
            return String.valueOf(anneeActuelle);
        }
    }
}