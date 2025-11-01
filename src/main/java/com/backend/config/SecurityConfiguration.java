package com.backend.config;

import com.backend.persistence.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.POST;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfiguration {

    private final JwtTokenProvider jwtTokenProvider;
    private final UtilisateurRepository utilisateurRepository;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;

    // Définir les chemins d'API selon ta structure
    private static final String LOGIN_PATH = "/OSE/login";
    private static final String PROGRAMMES_PATH = "/OSE/getProgrammes";
    private static final String EMPLOYEUR_REGISTER_PATH = "/OSEemployeur/creerCompte";
    private static final String ETUDIANT_REGISTER_PATH = "/OSEetudiant/creerCompte"; // À ajouter si tu as ce endpoint
    private static final String ETUDIANT_VOIR_OFFRES = "/OSEetudiant/voirOffres";
    private static final String GESTIONNAIRE_APPROVE_PATH = "/OSEGestionnaire/approuveOffre";
    private static final String GESTIONNAIRE_DENY_PATH = "/OSEGestionnaire/refuseOffre";
    private static final String GESTIONNAIRE_AWAITING_OFFERS = "/OSEGestionnaire/offresEnAttente";
    private static final String GESTIONNAIRE_APPROUVE_CV_PATH = "/OSEGestionnaire/approuveCV";
    private static final String GESTIONNAIRE_REFUSE_CV_PATH = "/OSEGestionnaire/refuseCV";
    private static final String GESTIONNAIRE_GET_ALL_CV_PATH = "/OSEGestionnaire/CVsEnAttente";
    private static final String EMPLOYEUR_PATH = "/OSEemployeur/**";
    private static final String ETUDIANT_PATH = "/OSEetudiant/**";
    private static final String GESTIONNAIRE_PATH = "/OSEGestionnaire/**";
    private static final String PROFESSEUR_PATH = "/OSEProfesseur/**";


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // Endpoints publics
                        .requestMatchers(POST, LOGIN_PATH).permitAll()
                        .requestMatchers(POST, EMPLOYEUR_REGISTER_PATH).permitAll()
                        .requestMatchers(POST, ETUDIANT_REGISTER_PATH).permitAll()
                        .requestMatchers(GET, PROGRAMMES_PATH).permitAll()
                        .requestMatchers(GET, ETUDIANT_VOIR_OFFRES).permitAll()

                        // Endpoints protégés par rôle
                        .requestMatchers(EMPLOYEUR_PATH).hasAuthority("EMPLOYEUR")
                        .requestMatchers(ETUDIANT_PATH).hasAuthority("ETUDIANT")
                        .requestMatchers(GESTIONNAIRE_PATH).hasAuthority("GESTIONNAIRE")
                        .requestMatchers(PROFESSEUR_PATH).hasAuthority("PROFESSEUR")


                        .anyRequest().authenticated()
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(configurer ->
                        configurer.authenticationEntryPoint(authenticationEntryPoint)
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Configuration pour ton frontend React sur port 5173
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList(
                HttpMethod.GET.name(),
                HttpMethod.POST.name(),
                HttpMethod.PUT.name(),
                HttpMethod.DELETE.name(),
                HttpMethod.OPTIONS.name()
        ));
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Cache-Control",
                "Content-Type",
                "Accept",
                "X-Requested-With",
                "*"
        ));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtTokenProvider, utilisateurRepository);
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration
    ) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

}