package com.morph_vpn.plugin.wireguard_obfuscation;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Random;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets; 

public class Encryptor {
    private String algorithm = "AES/CBC/PKCS5Padding";
    public PrivateKey privateKey;
    public PublicKey publicKey;
    public String remotePublicKey = "";
    public String password;
    public SecretKey simpleKey;
    public byte[] iv;

    public Encryptor(String password) {
        if (password != null && !password.isEmpty()) {
            this.password = password;
        } else {
            this.password = "bumoyu123";
        }
        // Generate RSA key pair
        try {
            KeyPairGenerator keyPairGen = KeyPairGenerator.getInstance("RSA");
            keyPairGen.initialize(2048);
            KeyPair pair = keyPairGen.generateKeyPair();
            this.publicKey = pair.getPublic();
            this.privateKey = pair.getPrivate();
            String salt = generateSalt(16);
            SecretKey key = KeyGenerator.getInstance("AES").generateKey();
            byte[] iv = new byte[16];
            this.simpleKey = key;
            this.iv = iv;
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void setSimple(String combinedBase64String) {
        try {
            String base64Key = combinedBase64String.split(":")[0];
            String base64Iv = combinedBase64String.split(":")[1];   
            byte[] keyBytes = Base64.getDecoder().decode(base64Key);
            byte[] ivBytes = Base64.getDecoder().decode(base64Iv);
            this.simpleKey = new SecretKeySpec(keyBytes, "AES");
            this.iv = ivBytes;
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

   public String convertPublicKeyToString() {
       String pemKey = derToPem(this.publicKey, "PUBLIC KEY");
       byte[] stringBytes = pemKey.getBytes(StandardCharsets.UTF_8);

        // 使用Base64编码器编码字节数组
        String base64EncodedString = Base64.getEncoder().encodeToString(stringBytes);   
        return base64EncodedString;
    }

    public String generateSalt(int length) {
        String charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
        StringBuilder salt = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < length; i++) {
            int randomIndex = random.nextInt(charset.length());
            salt.append(charset.charAt(randomIndex));
        }
        return salt.toString();
    }

    public String encrypt(String text, SecretKey key, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance(algorithm);
        IvParameterSpec ivParams = new IvParameterSpec(iv);
        cipher.init(Cipher.ENCRYPT_MODE, key, ivParams);
        byte[] encrypted = cipher.doFinal(text.getBytes());
        return Base64.getEncoder().encodeToString(encrypted);
    }

    public String decrypt(String encryptedText, SecretKey key, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance(algorithm);
        IvParameterSpec ivParams = new IvParameterSpec(iv);
        cipher.init(Cipher.DECRYPT_MODE, key, ivParams);
        byte[] original = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
        return new String(original);
    }

    public String encryptWithPublicKey(String data, String remotePublicKey) throws Exception {
        String pem = new String(Base64.getDecoder().decode(remotePublicKey));
        System.out.println(pem);
        String publicKeyPem = pem.replace("-----BEGIN PUBLIC KEY-----", "")
                                .replace("-----END PUBLIC KEY-----", "")
                                .replaceAll(System.lineSeparator(), "");
        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(Base64.getDecoder().decode(publicKeyPem));
        PublicKey pubKey = KeyFactory.getInstance("RSA").generatePublic(keySpec);
        Cipher cipher = Cipher.getInstance("RSA");
        cipher.init(Cipher.ENCRYPT_MODE, pubKey);
        byte[] encryptedData = cipher.doFinal(data.getBytes());
        return Base64.getEncoder().encodeToString(encryptedData);
    }

    public String decryptWithPrivateKey(String encryptedData) throws Exception {
        PrivateKey privKey = this.privateKey;
        Cipher cipher = Cipher.getInstance("RSA");
        cipher.init(Cipher.DECRYPT_MODE, privKey);
        byte[] decryptedData = cipher.doFinal(Base64.getDecoder().decode(encryptedData));
        return new String(decryptedData);
    }

    public EncryptedData finalEncrypt(String text, String remotePublicKey) {
        try {
            String salt = generateSalt(16);
            SecretKey key = KeyGenerator.getInstance("AES").generateKey();
            byte[] iv = new byte[16];
            new Random().nextBytes(iv);
            String d_send = encrypt(text, key, iv);
            String k_send = encryptWithPublicKey(Base64.getEncoder().encodeToString(key.getEncoded()), remotePublicKey); // Pass the byte array directly
            String i_send = Base64.getEncoder().encodeToString(iv);
            return new EncryptedData(d_send, k_send, i_send);
        } catch (Exception e) {
            System.err.println("Error in final encryption: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
        return null;
    }

    public String finalDecrypt(EncryptedData data) {
        try {
            // Step 1: Decrypt the Base64-encoded encrypted key using the privateKey
            String decryptedKeyBase64 = decryptWithPrivateKey(data.k);

            // Step 2: Convert the decrypted key from Base64 string to byte array
            byte[] decryptedKeyBytes = Base64.getDecoder().decode(decryptedKeyBase64);

            // Step 3: Convert the decrypted bytes to a SecretKey
            SecretKey decryptedKey = new SecretKeySpec(decryptedKeyBytes, "AES");

            // Step 4: Use the decrypted SecretKey to decrypt the data.d
            byte[] i_receive = Base64.getDecoder().decode(data.i);
            String d_receive = decrypt(data.d, decryptedKey, i_receive);
            return d_receive;
        } catch (Exception e) {
            System.err.println("Error in final decryption: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
        return null;
    }

    public static String derToPem(PublicKey publicKey, String keyType) {
        // Get the DER encoded bytes from the PublicKey
        byte[] derKey = publicKey.getEncoded();

        // Base64 encode the DER key
        String base64Encoded = Base64.getEncoder().encodeToString(derKey);

        // Wrap with PEM headers and footers
        return "-----BEGIN " + keyType + "-----\n" +
                formatPEM(base64Encoded) +
                "-----END " + keyType + "-----\n";
    }
    
    private static String formatPEM(String base64Encoded) {
        // Break the Base64 string into 64-character lines for PEM formatting
        StringBuilder formatted = new StringBuilder();
        for (int i = 0; i < base64Encoded.length(); i += 64) {
            int endIndex = Math.min(i + 64, base64Encoded.length());
            formatted.append(base64Encoded.substring(i, endIndex)).append("\n");
        }
        return formatted.toString();
    }

    public String simpleEncrypt(String text) {
        try {
            return encrypt(text, this.simpleKey, this.iv);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public String simpleDecrypt(String encryptedText) {
        try {
            return decrypt(encryptedText, this.simpleKey, this.iv);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public static class EncryptedData {
        public String d;
        public String k;
        public String i;

        public EncryptedData(String d, String k, String i) {
            this.d = d;
            this.k = k;
            this.i = i;
        }
    }
    
    public static void main(String[] args) {
        try {
            Encryptor encryptor = new Encryptor("testPassword123");

            // Test 1: Symmetric Encryption and Decryption
            String originalText = "Hello, World!";
            SecretKey key = KeyGenerator.getInstance("AES").generateKey();
            byte[] iv = new byte[16];
            new Random().nextBytes(iv);
            String encryptedText = encryptor.encrypt(originalText, key, iv);
            String decryptedText = encryptor.decrypt(encryptedText, key, iv);
            System.out.println("Symmetric Encryption and Decryption Test:");
            System.out.println("Original: " + originalText);
            System.out.println("Encrypted: " + encryptedText);
            System.out.println("Decrypted: " + decryptedText);

           // Test 2: Simple Encryption and Decryption
            encryptor.setSimple("B9EMizUe2tP3dqu8GlX3amO3uERua9HhPVqANMWyXUY=:0y7LOFmW415sBKGUQ5A0Fg==");
            String simpleText = "Hello, World!";
            String encryptedSimpleText = encryptor.simpleEncrypt(simpleText);
            String decryptedSimpleText = encryptor.simpleDecrypt(encryptedSimpleText);
            System.out.println("\nSimple Encryption and Decryption Test:");
            System.out.println("Original: " + simpleText);
            System.out.println("Encrypted: " + encryptedSimpleText);
            System.out.println("Decrypted: " + decryptedSimpleText);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}