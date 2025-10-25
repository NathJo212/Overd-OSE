package com.backend.config;

import com.backend.Exceptions.AuthenticationException;
import com.backend.Exceptions.UtilisateurPasTrouveException;
import com.backend.persistence.UtilisateurRepository;
import com.backend.modele.Utilisateur;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthProvider implements AuthenticationProvider {
    private final PasswordEncoder passwordEncoder;
    private final UtilisateurRepository utilisateurRepository;

    @Override
    public Authentication authenticate(Authentication authentication) {
        Utilisateur user = null;
        try {
            user = loadUserByEmail(authentication.getPrincipal().toString());
        } catch (UtilisateurPasTrouveException e) {
            throw new RuntimeException(e);
        }
        try {
            validateAuthentication(authentication, user);
        } catch (AuthenticationException e) {
            throw new RuntimeException(e);
        }
        return new UsernamePasswordAuthenticationToken(
                user.getEmail(),
                user.getPassword(),
                user.getAuthorities()
        );
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }

    private Utilisateur loadUserByEmail(String email) throws UtilisateurPasTrouveException {
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(UtilisateurPasTrouveException::new);
    }

    private void validateAuthentication(Authentication authentication, Utilisateur user) throws AuthenticationException {
        if (!passwordEncoder.matches(authentication.getCredentials().toString(), user.getPassword())) {
            throw new AuthenticationException();
        }
    }
}
