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

@Component
public class JwtTokenProvider {
    @Value("${application.security.jwt.expiration:86400000}")
    private int expirationInMs;

    @Value("${application.security.jwt.secret-key:2B7E151628AED2A6ABF7158809CF4F3C2B7E151628AED2A6ABF7158809CF4F3C}")
    private String jwtSecret;

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

    public void validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token);
        } catch (SecurityException | IllegalArgumentException | UnsupportedJwtException | ExpiredJwtException |
                 MalformedJwtException ex) {
            throw new InvalidJwtTokenException();
        }
    }
}