package com.backend.util;

import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class EncryptageCV {
    private SecretKey chargerCleDepuisKeyStore() throws Exception {
        String keystorePath = "keystore.jks";
        String keystorePassword = System.getenv("KEYSTORE_PASSWORD");
        String keyAlias = "cle_travail";
        KeyStore keyStore = KeyStore.getInstance("JCEKS");
        try (FileInputStream fis = new FileInputStream(keystorePath)) {
            keyStore.load(fis, keystorePassword.toCharArray());
        }
        KeyStore.PasswordProtection protection = new KeyStore.PasswordProtection(keystorePassword.toCharArray());
        KeyStore.SecretKeyEntry entry = (KeyStore.SecretKeyEntry) keyStore.getEntry(keyAlias, protection);
        return entry.getSecretKey();
    }

    public String chiffrer(byte[] data) throws Exception {
        SecretKey secretKey = chargerCleDepuisKeyStore();
        byte[] iv = new byte[12];
        SecureRandom secureRandom = new SecureRandom();
        secureRandom.nextBytes(iv);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec gcmSpec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);
        byte[] ciphertext = cipher.doFinal(data);

        // Encode IV et ciphertext en Base64, séparés par ;
        return Base64.getEncoder().encodeToString(iv) + ";" + Base64.getEncoder().encodeToString(ciphertext);
    }

    public byte[] dechiffrer(String dataChiffre) throws Exception {
        SecretKey secretKey = chargerCleDepuisKeyStore();
        String[] parts = dataChiffre.split(";");
        byte[] iv = Base64.getDecoder().decode(parts[0]);
        byte[] ciphertext = Base64.getDecoder().decode(parts[1]);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec gcmSpec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);
        return cipher.doFinal(ciphertext);
    }
}
