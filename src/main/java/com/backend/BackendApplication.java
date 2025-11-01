package com.backend;

import com.backend.service.DTO.AuthResponseDTO;
import com.backend.service.DTO.ProgrammeDTO;
import com.backend.service.EmployeurService;
import com.backend.service.EtudiantService;
import com.backend.service.GestionnaireService;
import com.backend.service.UtilisateurService;
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
    public CommandLineRunner run(EmployeurService employeurService, EtudiantService etudiantService, UtilisateurService utilisateurService, GestionnaireService gestionnaireService) {
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



            AuthResponseDTO utilisateurTest = utilisateurService.authentifierUtilisateur("mon@employeur.com", "Employeur123%");
            System.out.println("Employeur contact: " + utilisateurTest.getUtilisateurDTO().getContact());

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Mon stage",
                    "Stage react",
                    LocalDate.now().plusWeeks(1),
                    LocalDate.now().plusMonths(6),
                    ProgrammeDTO.P180_A0,
                    "Montréal",
                    "15$/h",
                    LocalDate.now().plusDays(1),
                    "matinale",
                    20,
                    "Faire le café",
                    "Faire du bon café",
                    "Apprendre React"
            );

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Développeur Java",
                    "Stage backend sur une application Spring Boot",
                    LocalDate.now().minusMonths(8),
                    LocalDate.now().minusMonths(2),
                    ProgrammeDTO.P200_B1,
                    "Montréal",
                    "15$/h",
                    LocalDate.now().plusMonths(6),
                    "soirée",
                    30,
                    "Développer des APIs",
                    "Fournir l'encadrement et les outils nécessaires",
                    "Utiliser Spring Boot pour développer des APIs RESTful"
            );

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Java",
                    "Test",
                    LocalDate.now(),
                    LocalDate.now().plusMonths(4),
                    ProgrammeDTO.P200_B1,
                    "Quebec",
                    "18$/h",
                    LocalDate.now().minusDays(10),
                    "flexible",
                    25,
                    "Coder en Java",
                    "Encadrer et valider le travail de l'étudiant",
                    "Développer des applications en Java"
            );


        };
    }
}
