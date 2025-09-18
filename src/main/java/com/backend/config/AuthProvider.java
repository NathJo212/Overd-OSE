package com.backend.config;

import com.backend.persistence.UtilisateurRepository;
import com.backend.modele.Utilisateur;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthProvider implements AuthenticationProvider {
    private final PasswordEncoder passwordEncoder;
    private final UtilisateurRepository userRepository;

    @Override
    public Authentication authenticate(Authentication authentication) {
        Utilisateur user = loadUserByEmail(authentication.getPrincipal().toString());
        validateAuthentication(authentication, user);
        return new UsernamePasswordAuthenticationToken(
                user.getCredentials(), // Use credentials instead of email directly
                user.getPassword(),
                user.getAuthorities()
        );
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }

    private Utilisateur loadUserByEmail(String email) throws UsernameNotFoundException {
        return userRepository.findByCredentialsEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private void validateAuthentication(Authentication authentication, Utilisateur user) {
        if (!passwordEncoder.matches(authentication.getCredentials().toString(), user.getPassword())) {
            throw new RuntimeException("Incorrect username or password");
        }
    }
}