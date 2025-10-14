package com.backend.modele;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "candidature")
@Getter
@Setter
@NoArgsConstructor
public class Candidature {

    public enum StatutCandidature {
        EN_ATTENTE,
        ACCEPTEE,
        REFUSEE,
        RETIREE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "etudiant_id", nullable = false)
    private Etudiant etudiant;

    @ManyToOne
    @JoinColumn(name = "offre_id", nullable = false)
    private Offre offre;

    @Column(name = "date_candidature", nullable = false)
    private LocalDateTime dateCandidature;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false)
    private StatutCandidature statut = StatutCandidature.EN_ATTENTE;

    @Lob
    @Column(name = "lettre_motivation")
    private byte[] lettreMotivation;

    @Column(name = "message_reponse", length = 1000)
    private String messageReponse;

    @OneToOne(mappedBy = "candidature", cascade = CascadeType.ALL)
    private ConvocationEntrevue convocationEntrevue;

    public Candidature(Etudiant etudiant, Offre offre, byte[] lettreMotivation) {
        this.etudiant = etudiant;
        this.offre = offre;
        this.lettreMotivation = lettreMotivation;
        this.dateCandidature = LocalDateTime.now();
        this.statut = StatutCandidature.EN_ATTENTE;
    }
}