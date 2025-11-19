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
    public CommandLineRunner run(EmployeurService employeurService, EtudiantService etudiantService, UtilisateurService utilisateurService, GestionnaireService gestionnaireService, ProfesseurService professeurService, AnneeAcademiqueService anneeAcademiqueService) {
        return _ -> {
            // Initialiser les années académiques
            System.out.println("=== Initialisation des années académiques ===");
            anneeAcademiqueService.initialiserAnneesAcademiques();
            System.out.println("Années académiques initialisées !");

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
                    ProgrammeDTO.P420_B0,
                    "Automne",
                    "3ème année"
            );


            etudiantService.creerEtudiant(
                    "etudiant2@example.com",
                    "Etudiant128&",
                    "987-654-3210",
                    "George",
                    "Dubois",
                    ProgrammeDTO.P221_A0,
                    "Automne",
                    "3ème année"
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
            System.out.println("Employeur contact: " + utilisateurTest.getUtilisateurDTO().getContact());

            // ========== OFFRES ANNÉE COURANTE (2025-2026) ==========
            System.out.println("\n=== Création d'offres pour l'année courante (2025-2026) ===");
            
            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Stage React 2025",
                    "Stage react année courante",
                    LocalDate.now().plusWeeks(1),
                    LocalDate.now().plusMonths(6),
                    ProgrammeDTO.P420_B0,
                    "Montréal",
                    "15$/h",
                    LocalDate.now().plusDays(30),
                    "matinale",
                    20,
                    "Faire le café",
                    "Apprendre React",
                    "Encourager l'étudiant",
                    "Découvrir le développement front-end en React"
            );

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Développeur Java 2025",
                    "Stage backend Spring Boot année courante",
                    LocalDate.of(2026, 1, 15),
                    LocalDate.of(2026, 5, 15),
                    ProgrammeDTO.P420_B0,
                    "Montréal",
                    "18$/h",
                    LocalDate.of(2026, 1, 5),
                    "soirée",
                    30,
                    "Développer des APIs",
                    "Utiliser Spring Boot pour développer des APIs RESTful",
                    "Faire respecter les droits de l'étudiant",
                    "Approfondir la programmation backend"
            );

            // ========== OFFRES ANNÉE 2024-2025 (PASSÉE) ==========
            System.out.println("\n=== Création d'offres pour l'année 2024-2025 (année passée) ===");
            
            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Stage Python 2024",
                    "Stage développement Python - Année 2024-2025",
                    LocalDate.of(2024, 9, 1),
                    LocalDate.of(2025, 1, 15),
                    ProgrammeDTO.P420_B0,
                    "Québec",
                    "16$/h",
                    LocalDate.of(2024, 8, 15),
                    "flexible",
                    25,
                    "Développer en Python",
                    "Créer des scripts d'automatisation",
                    "Superviser l'apprentissage",
                    "Maîtriser Python"
            );

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Stage Web 2024",
                    "Développement web full-stack - Année 2024-2025",
                    LocalDate.of(2025, 1, 20),
                    LocalDate.of(2025, 5, 30),
                    ProgrammeDTO.P420_B0,
                    "Montréal",
                    "17$/h",
                    LocalDate.of(2025, 1, 10),
                    "matinale",
                    30,
                    "Développer des applications web",
                    "Utiliser React et Node.js",
                    "Former l'étudiant",
                    "Devenir développeur full-stack"
            );

            // ========== OFFRES ANNÉE 2023-2024 (TRÈS ANCIENNE) ==========
            System.out.println("\n=== Création d'offres pour l'année 2023-2024 (très ancienne) ===");
            
            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Stage Database 2023",
                    "Administration de bases de données - Année 2023-2024",
                    LocalDate.of(2023, 9, 15),
                    LocalDate.of(2024, 1, 31),
                    ProgrammeDTO.P420_B0,
                    "Laval",
                    "14$/h",
                    LocalDate.of(2023, 9, 1),
                    "soirée",
                    20,
                    "Gérer des bases de données",
                    "Apprendre SQL et MongoDB",
                    "Guider l'étudiant",
                    "Comprendre les bases de données"
            );

            System.out.println("\n=== Données de test créées avec succès ! ===");
            System.out.println("Offres créées pour les années : 2023-2024, 2024-2025, 2025-2026");


        };
    }
}
