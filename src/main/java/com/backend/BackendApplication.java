package com.backend;

import com.backend.service.EmployeurService;
import com.backend.service.EtudiantService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner run(EmployeurService employeurService, EtudiantService etudiantService) {
        return args -> {
            employeurService.creerEmployeur(
                    "mon@employeur.com",
                    "123456789",
                    "(514) 582-9898",
                    "Gogole",
                    "Jaques L'heureux"
            );

            etudiantService.creerEtudiant(
                    "etudiant@example.com",
                    "etudiantpass",
                    "987-654-3210",
                    "Martin",
                    "Durand",
                    "Informatique",
                    "Automne",
                    "2025"
            );
        };
    }
}
