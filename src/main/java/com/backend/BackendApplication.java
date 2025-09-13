package com.backend;

import com.backend.service.EmployeurService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner run(EmployeurService employeurService) {
        return args -> {
            employeurService.creerEmployeur(
                    "test@example.com",
                    "password123",
                    "123-456-7890",
                    "Ma Super Entreprise",
                    "Jean Dupont"
            );
        };
    }
}
