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

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    @Profile("!test")
    public CommandLineRunner run(EmployeurService employeurService, EtudiantService etudiantService, UtilisateurService utilisateurService, GestionnaireService gestionnaireService) {
        return args -> {
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

            employeurService.creerOffreDeStage(utilisateurTest, "Mon stage", "stage super cool", "un jour", "un jour", ProgrammeDTO.P180_A0, "MTL", "10000000$", "un jour");

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Développeur Java",
                    "Stage backend sur une application Spring Boot",
                    "2024-01-01",
                    "2024-06-01",
                    ProgrammeDTO.P200_B1,
                    "Montréal",
                    "15$/h",
                    "2023-12-15"
            );

            employeurService.creerOffreDeStage(
                    utilisateurTest,
                    "Java",
                    "Test",
                    "2025-01-01",
                    "2025-06-01",
                    ProgrammeDTO.P200_B1,
                    "Quebec",
                    "18$/h",
                    "2025-12-15"
            );

        };
    }
}
