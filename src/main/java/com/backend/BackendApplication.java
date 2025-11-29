package com.backend;

import com.backend.service.*;
import com.backend.service.DTO.AuthResponseDTO;
import com.backend.service.DTO.ProgrammeDTO;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;

import java.time.LocalDate;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    @Profile("!test")
    public CommandLineRunner run(EmployeurService employeurService, EtudiantService etudiantService, UtilisateurService utilisateurService, GestionnaireService gestionnaireService, ProfesseurService professeurService) {
        return _ -> {
            employeurService.creerEmployeur(
                    "mon@employeur.com",
                    "Employeur123%",
                    "(514) 582-9898",
                    "Gogole",
                    "Jaques L'heureux"
            );

            etudiantService.creerEtudiant(
                    "etudiant@example.com",
                    "Etudiant128&",
                    "987-654-3210",
                    "Martin",
                    "Durand",
                    ProgrammeDTO.P420_B0
//                    "3ème année"
            );


            etudiantService.creerEtudiant(
                    "etudiant2@example.com",
                    "Etudiant128&",
                    "987-654-3210",
                    "George",
                    "Dubois",
                    ProgrammeDTO.P221_A0
//                    "3ème année"
            );

            gestionnaireService.creerGestionnaire(
                    "gestionnaire@example.com",
                        "Gestion128&",
                    "985-657-3220",
                    "Martine",
                    "Legault"
            );

            professeurService.creerProfesseur(
                    "professeur@example.com",
                    "Prof128&",
                    "764-782-4572",
                    "Louis",
                    "Poirier"
            );

            professeurService.creerProfesseur(
                    "professeur2@example.com",
                    "Prof456&",
                    "438-555-0123",
                    "Claire",
                    "Beaulieu"
            );

            AuthResponseDTO utilisateurTest = utilisateurService.authentifierUtilisateur("mon@employeur.com", "Employeur123%");

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Mon stage",
                    "Stage react",
                    LocalDate.of(2026, 1, 15),
                    LocalDate.of(2026, 3, 30),
                    ProgrammeDTO.P420_B0,
                    "Montréal",
                    "15$/h",
                    LocalDate.now().plusDays(2),
                    "matinale",
                    20,
                    "Faire le café",
                    "Apprendre React",
                    "Encourager l'étudiant",
                    "Découvrir le développement front-end en React"
            );

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Développeur Java",
                    "Stage backend Spring Boot",
                    LocalDate.of(2026, 2, 1),
                    LocalDate.of(2026, 4, 20),
                    ProgrammeDTO.P420_B0,
                    "Montréal",
                    "15$/h",
                    LocalDate.now().plusDays(2),
                    "soirée",
                    30,
                    "Développer des APIs",
                    "Utiliser Spring Boot",
                    "Faire respecter les droits",
                    "Approfondir la programmation backend"
            );

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Développeur Python",
                    "Stage d'automatisation Python",
                    LocalDate.of(2026, 1, 20),
                    LocalDate.of(2026, 3, 25),
                    ProgrammeDTO.P420_B0,
                    "Québec",
                    "17$/h",
                    LocalDate.now().plusDays(5),
                    "jour",
                    35,
                    "Créer des scripts",
                    "Maîtriser Python",
                    "Supervision du mentor",
                    "Apprentissage de l’automatisation"
            );

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Développeur Fullstack",
                    "Stage React + Node.js",
                    LocalDate.of(2026, 2, 10),
                    LocalDate.of(2026, 5, 5),
                    ProgrammeDTO.P420_B0,
                    "Laval",
                    "18$/h",
                    LocalDate.now().plusDays(3),
                    "jour",
                    40,
                    "Développer des interfaces Web",
                    "Apprendre Node.js",
                    "Respect des règles internes",
                    "Découvrir le développement fullstack"
            );

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Développeur Mobile",
                    "Stage Flutter",
                    LocalDate.of(2026, 1, 10),
                    LocalDate.of(2026, 3, 20),
                    ProgrammeDTO.P420_B0,
                    "Longueuil",
                    "16$/h",
                    LocalDate.now().plusDays(4),
                    "matinale",
                    25,
                    "Créer des écrans UI",
                    "Comprendre Flutter",
                    "Encadrement par l'équipe",
                    "Apprendre le développement mobile"
            );

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Technicien Réseau",
                    "Stage Cisco et configuration réseau",
                    LocalDate.of(2026, 2, 5),
                    LocalDate.of(2026, 4, 28),
                    ProgrammeDTO.P420_B0,
                    "Montréal",
                    "17$/h",
                    LocalDate.now().plusDays(3),
                    "jour",
                    37,
                    "Câblage réseau",
                    "Apprendre Cisco",
                    "Supervision continue",
                    "Connaître les bases réseau"
            );

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "QA / Testeur logiciel",
                    "Stage en assurance qualité",
                    LocalDate.of(2026, 1, 25),
                    LocalDate.of(2026, 4, 15),
                    ProgrammeDTO.P420_B0,
                    "Sherbrooke",
                    "15$/h",
                    LocalDate.now().plusDays(2),
                    "soirée",
                    28,
                    "Exécuter des tests",
                    "Écrire des cas de test",
                    "Encadrement QA",
                    "Découvrir la qualité logicielle"
            );

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Administrateur système",
                    "Stage gestion de serveurs Linux",
                    LocalDate.of(2026, 2, 20),
                    LocalDate.of(2026, 5, 10),
                    ProgrammeDTO.P420_B0,
                    "Québec",
                    "19$/h",
                    LocalDate.now().plusDays(6),
                    "jour",
                    38,
                    "Maintenance serveur",
                    "Apprendre Linux",
                    "Encadrement sysadmin",
                    "Comprendre l'administration système"
            );

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Développeur Data",
                    "Stage en traitement de données",
                    LocalDate.of(2026, 1, 18),
                    LocalDate.of(2026, 4, 30),
                    ProgrammeDTO.P420_B0,
                    "Montréal",
                    "18$/h",
                    LocalDate.now().plusDays(3),
                    "matinale",
                    32,
                    "Créer des pipelines",
                    "Apprendre SQL",
                    "Supervision d’équipe",
                    "Comprendre la data science"
            );

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Développeur Jeux Vidéo",
                    "Stage Unity jeux 2D/3D",
                    LocalDate.of(2026, 3, 1),
                    LocalDate.of(2026, 5, 20),
                    ProgrammeDTO.P420_B0,
                    "Montréal",
                    "16$/h",
                    LocalDate.now().plusDays(7),
                    "soirée",
                    30,
                    "Créer des scènes Unity",
                    "Apprendre C#",
                    "Suivi par un mentor",
                    "Découvrir l'industrie du jeu vidéo"
            );

        };
    }
}
