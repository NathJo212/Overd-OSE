package com.backend.config;

import com.backend.Exceptions.UserNotFoundException;
import com.backend.modele.Utilisateur;
import com.backend.persistence.UtilisateurRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenProvider tokenProvider;
    private final UtilisateurRepository userRepository;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UtilisateurRepository userRepository) {
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String header = getJWTFromRequest(request);
        if (StringUtils.hasText(header)) {
            String token = header.startsWith("Bearer ") ? header.substring(7) : header;
            token = token.trim();
            try {
                tokenProvider.validateToken(token);
                String email = tokenProvider.getEmailFromJWT(token);
                Utilisateur user = userRepository.findByEmail(email)
                        .orElseThrow(UserNotFoundException::new);

                UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(
                                user.getEmail(), null, user.getAuthorities()
                        );
                authenticationToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            } catch (Exception e) {
                logger.error("Impossible de définir l'authentification utilisateur", e);
            }
        }
        filterChain.doFilter(request, response);
    }

    private String getJWTFromRequest(HttpServletRequest request) {
        return request.getHeader("Authorization");
    }
}