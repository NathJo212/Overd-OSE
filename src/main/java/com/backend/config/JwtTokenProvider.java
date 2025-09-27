package com.backend.config;

import com.backend.Exceptions.InvalidJwtTokenException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

@Component
public class JwtTokenProvider {
    @Value("${application.security.jwt.expiration:86400000}")
    private int expirationInMs;

    @Value("${application.security.jwt.secret-key:2B7E151628AED2A6ABF7158809CF4F3C2B7E151628AED2A6ABF7158809CF4F3C}")
    private String jwtSecret;

    private final Set<String> tokenBlacklist = new HashSet<>();


    public String generateToken(Authentication authentication) {
        long nowMillis = System.currentTimeMillis();
        JwtBuilder builder = Jwts.builder()
                .setSubject(authentication.getName())
                .setIssuedAt(new Date(nowMillis))
                .setExpiration(new Date(nowMillis + expirationInMs))
                .claim("authorities", authentication.getAuthorities())
                .signWith(key());
        return builder.compact();
    }

    private Key key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    public String getEmailFromJWT(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public void logout(String token) {
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        tokenBlacklist.add(cleanToken);
    }

    public boolean isTokenBlacklisted(String token) {
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        return tokenBlacklist.contains(cleanToken);
    }

    public void validateToken(String token) {
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        if (isTokenBlacklisted(cleanToken)) {
            throw new InvalidJwtTokenException();
        }
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(cleanToken);
        } catch (SecurityException | IllegalArgumentException | UnsupportedJwtException | ExpiredJwtException |
                 MalformedJwtException ex) {
            throw new InvalidJwtTokenException();
        }
    }

    public boolean isEmployeur(String token, JwtTokenProvider jwtTokenProvider) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(jwtTokenProvider.key())
                .build()
                .parseClaimsJws(token.startsWith("Bearer ") ? token.substring(7) : token)
                .getBody();

        Object authorities = claims.get("authorities");
        return authorities != null && authorities.toString().contains("EMPLOYEUR");
    }
}