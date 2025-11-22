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

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Mon stage",
                    "Stage react",
                    LocalDate.now().plusWeeks(10),
                    LocalDate.now().plusMonths(6),
                    ProgrammeDTO.P420_B0,
                    "Montréal",
                    "15$/h",
                    LocalDate.now().plusDays(1),
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
                    "Stage backend sur une application Spring Boot",
                    LocalDate.now().minusMonths(8),
                    LocalDate.now().minusMonths(2),
                    ProgrammeDTO.P420_B0,
                    "Montréal",
                    "15$/h",
                    LocalDate.now().plusMonths(6),
                    "soirée",
                    30,
                    "Développer des APIs",
                    "Utiliser Spring Boot pour développer des APIs RESTful",
                    "Faire respecter les droits de l'étudiant",
                    "Approfondir la programmation backend"
            );

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Java",
                    "Test",
                    LocalDate.now(),
                    LocalDate.now().plusMonths(4),
                    ProgrammeDTO.P420_B0,
                    "Quebec",
                    "18$/h",
                    LocalDate.now().minusDays(10),
                    "flexible",
                    25,
                    "Coder en Java",
                    "Développer des applications en Java",
                    "Veiller à l'apprentissage de l'étudiant",
                    "Mettre en pratique la programmation orientée objet"
            );


        };
    }
}
