package com.backend.AES;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyStore;

public class GenKey {

    static String KEY_STORE_PASSWORD = "";

    public static String retrouverMotDePasseDuKeystore() {
        KEY_STORE_PASSWORD = System.getenv("KEYSTORE_PASSWORD");
        if (KEY_STORE_PASSWORD != null && !KEY_STORE_PASSWORD.isEmpty()){
            return KEY_STORE_PASSWORD;
        }
        throw new IllegalStateException("La variable d'environnement KEYSTORE_PASSWORD n'est pas définie ou vide.");
    }

    public static void main(String[] args) throws Exception {
        // Génère une clé AES de 256 bits
        KeyGenerator generateurDeCle = KeyGenerator.getInstance("AES");
        generateurDeCle.init(256);
        SecretKey cleSecrete = generateurDeCle.generateKey();

        // Crée un KeyStore JCEKS et ajoute la clé
        KeyStore keyStore = KeyStore.getInstance("JCEKS");
        keyStore.load(null, null);
        KeyStore.SecretKeyEntry entreeDeCleSecrete = new KeyStore.SecretKeyEntry(cleSecrete);
        KeyStore.PasswordProtection protection = new KeyStore.PasswordProtection(retrouverMotDePasseDuKeystore().toCharArray());
        keyStore.setEntry("cle_pour_tp3", entreeDeCleSecrete, protection);

        try (var out = Files.newOutputStream(Paths.get("keystore.jks"))) {
            keyStore.store(out, retrouverMotDePasseDuKeystore().toCharArray());
        }
    }
}
