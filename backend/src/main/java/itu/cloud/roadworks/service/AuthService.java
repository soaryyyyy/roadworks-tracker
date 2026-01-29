package itu.cloud.roadworks.service;

import itu.cloud.roadworks.dto.AuthResponse;
import itu.cloud.roadworks.dto.LoginRequest;
import itu.cloud.roadworks.dto.RegisterRequest;
import itu.cloud.roadworks.model.Account;
import itu.cloud.roadworks.model.Config;
import itu.cloud.roadworks.model.Role;
import itu.cloud.roadworks.model.Session;
import itu.cloud.roadworks.repository.AccountRepository;
import itu.cloud.roadworks.repository.ConfigRepository;
import itu.cloud.roadworks.repository.RoleRepository;
import itu.cloud.roadworks.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final SessionRepository sessionRepository;
    private final ConfigRepository configRepository;
    private final FirebaseService firebaseService;

    private static final String ROLE_MANAGER = "manager";
    private static final String ROLE_UTILISATEUR = "utilisateur";
    private static final int DEFAULT_SESSION_DURATION_MINUTES = 60;
    private static final int DEFAULT_MAX_ATTEMPTS = 5;

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        Optional<Account> accountOpt = accountRepository.findByUsername(request.getUsername());

        if (accountOpt.isEmpty()) {
            return AuthResponse.builder()
                    .message("Nom d'utilisateur ou mot de passe incorrect")
                    .build();
        }

        Account account = accountOpt.get();

        if (account.getIsLocked()) {
            return AuthResponse.builder()
                    .message("Compte bloqué. Veuillez contacter l'administrateur.")
                    .build();
        }

        if (!account.getIsActive()) {
            return AuthResponse.builder()
                    .message("Compte désactivé")
                    .build();
        }

        String hashedPassword = hashPassword(request.getPassword());
        if (!hashedPassword.equals(account.getPwd())) {
            handleFailedLogin(account);
            return AuthResponse.builder()
                    .message("Nom d'utilisateur ou mot de passe incorrect")
                    .build();
        }

        // Reset attempts on successful login
        account.setAttempts(0);
        account.setLastLogin(Instant.now());
        accountRepository.save(account);

        // Create session
        Session session = createSession(account, ipAddress, userAgent);

        return AuthResponse.builder()
                .token(session.getToken())
                .username(account.getUsername())
                .role(account.getRole().getLibelle())
                .message("Connexion réussie")
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (accountRepository.existsByUsername(request.getUsername())) {
            return AuthResponse.builder()
                    .message("Ce nom d'utilisateur existe déjà")
                    .build();
        }

        String roleLibelle = request.getRole() != null ? request.getRole() : ROLE_MANAGER;
        Role role = roleRepository.findByLibelle(roleLibelle)
                .orElseThrow(() -> new RuntimeException("Role " + roleLibelle + " non trouvé"));

        // Créer l'utilisateur dans Firebase
        String firebaseUid;
        try {
            String email = request.getUsername() + "@roadworks.app"; // Utiliser un email par défaut
            firebaseUid = firebaseService.createFirebaseUser(
                    email, 
                    request.getPassword(), 
                    request.getUsername()
            );
            log.info("Utilisateur créé dans Firebase avec UID: {}", firebaseUid);
        } catch (Exception e) {
            log.error("Erreur lors de la création de l'utilisateur dans Firebase: {}", e.getMessage());
            return AuthResponse.builder()
                    .message("Erreur lors de la création de l'utilisateur: " + e.getMessage())
                    .build();
        }

        Account account = Account.builder()
                .username(request.getUsername())
                .pwd(hashPassword(request.getPassword()))
                .role(role)
                .createdAt(Instant.now())
                .isActive(true)
                .isLocked(false)
                .attempts(0)
                .build();

        accountRepository.save(account);

        return AuthResponse.builder()
                .username(account.getUsername())
                .role(account.getRole().getLibelle())
                .message("Compte créé avec succès")
                .build();
    }

    @Transactional
    public void logout(String token) {
        sessionRepository.findByToken(token)
                .ifPresent(sessionRepository::delete);
    }

    public Optional<Account> validateToken(String token) {
        return sessionRepository.findByTokenAndExpiresAtAfter(token, Instant.now())
                .map(Session::getAccount);
    }

    private void handleFailedLogin(Account account) {
        int maxAttempts = getMaxAttempts();
        account.setAttempts(account.getAttempts() + 1);
        account.setLastFailedLogin(Instant.now());

        if (account.getAttempts() >= maxAttempts) {
            account.setIsLocked(true);
        }

        accountRepository.save(account);
    }

    private Session createSession(Account account, String ipAddress, String userAgent) {
        int sessionDuration = getSessionDuration();

        String token = generateToken();
        Session session = Session.builder()
                .account(account)
                .token(token)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(sessionDuration, ChronoUnit.MINUTES))
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        return sessionRepository.save(session);
    }

    private String generateToken() {
        return UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
    }

    private String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erreur de hachage du mot de passe", e);
        }
    }

    private int getSessionDuration() {
        return configRepository.findAll().stream()
                .findFirst()
                .map(Config::getSessionDuration)
                .orElse(DEFAULT_SESSION_DURATION_MINUTES);
    }

    private int getMaxAttempts() {
        return configRepository.findAll().stream()
                .findFirst()
                .map(Config::getMaxAttempts)
                .orElse(DEFAULT_MAX_ATTEMPTS);
    }

    @Transactional(readOnly = true)
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Account> getAllUsers() {
        return accountRepository.findAllWithRole();
    }

    public List<Map<String, Object>> getAllFirebaseUsersFormatted() {
        List<com.google.firebase.auth.UserRecord> firebaseUsers = firebaseService.getAllFirebaseUsers();
        List<Map<String, Object>> result = new java.util.ArrayList<>();

        // Récupérer les utilisateurs bloqués depuis Firestore loginAttempts
        Map<String, Boolean> lockedUsers = getLockedUsersFromFirestore();

        for (com.google.firebase.auth.UserRecord user : firebaseUsers) {
            String displayName = user.getDisplayName();
            String email = user.getEmail();

            if (displayName == null || displayName.isEmpty()) {
                if (email != null && !email.isEmpty()) {
                    displayName = email.split("@")[0];
                } else {
                    displayName = user.getUid();
                }
            }

            // Vérifier si bloqué dans loginAttempts (par email)
            boolean isLocked = email != null && lockedUsers.getOrDefault(email, false);

            Map<String, Object> userMap = new java.util.HashMap<>();
            userMap.put("id", user.getUid());
            userMap.put("username", displayName);
            userMap.put("email", email != null ? email : "");
            userMap.put("role", "utilisateur");
            userMap.put("isActive", !isLocked);
            userMap.put("isLocked", isLocked);
            userMap.put("createdAt", user.getUserMetadata().getCreationTimestamp() > 0
                ? java.time.Instant.ofEpochMilli(user.getUserMetadata().getCreationTimestamp()).toString()
                : java.time.Instant.now().toString());
            result.add(userMap);
        }

        return result;
    }

    private Map<String, Boolean> getLockedUsersFromFirestore() {
        Map<String, Boolean> lockedUsers = new java.util.HashMap<>();
        try {
            com.google.cloud.firestore.Firestore firestore = firebaseService.getFirestore();
            if (firestore == null) {
                log.warn("Firestore non disponible");
                return lockedUsers;
            }

            com.google.cloud.firestore.QuerySnapshot snapshot = firestore
                    .collection("loginAttempts")
                    .whereEqualTo("isLocked", true)
                    .get()
                    .get();

            for (com.google.cloud.firestore.DocumentSnapshot doc : snapshot.getDocuments()) {
                String email = doc.getString("email");
                if (email != null) {
                    lockedUsers.put(email, true);
                }
            }
            log.info("Récupéré {} utilisateurs bloqués depuis Firestore", lockedUsers.size());
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des utilisateurs bloqués: {}", e.getMessage());
        }
        return lockedUsers;
    }

    public AuthResponse unlockFirebaseUser(String firebaseUid) {
        try {
            com.google.firebase.auth.UserRecord user = firebaseService.getFirebaseUser(firebaseUid);
            String email = user.getEmail();
            String displayName = user.getDisplayName() != null ? user.getDisplayName() : email;

            // Débloquer dans Firestore loginAttempts
            if (email != null) {
                unlockUserInFirestore(email);
            }

            log.info("Utilisateur Firebase {} débloqué", displayName);

            return AuthResponse.builder()
                    .username(displayName)
                    .message("Utilisateur débloqué avec succès")
                    .build();
        } catch (Exception e) {
            log.error("Erreur lors du déblocage de l'utilisateur Firebase: {}", e.getMessage());
            return AuthResponse.builder()
                    .message("Erreur: " + e.getMessage())
                    .build();
        }
    }

    private void unlockUserInFirestore(String email) {
        try {
            com.google.cloud.firestore.Firestore firestore = firebaseService.getFirestore();
            if (firestore == null) {
                log.warn("Firestore non disponible pour débloquer {}", email);
                return;
            }

            // Le document ID est l'email
            com.google.cloud.firestore.DocumentReference docRef = firestore
                    .collection("loginAttempts")
                    .document(email);

            com.google.cloud.firestore.DocumentSnapshot doc = docRef.get().get();
            if (doc.exists()) {
                // Mettre à jour le document: isLocked = false, failedAttempts = 0
                docRef.update(
                        "isLocked", false,
                        "failedAttempts", 0
                ).get();
                log.info("Utilisateur {} débloqué dans Firestore", email);
            }
        } catch (Exception e) {
            log.error("Erreur lors du déblocage dans Firestore: {}", e.getMessage());
        }
    }

    @Transactional
    public AuthResponse unlockUser(Long userId) {
        Optional<Account> accountOpt = accountRepository.findById(userId);

        if (accountOpt.isEmpty()) {
            return AuthResponse.builder()
                    .message("Utilisateur non trouvé")
                    .build();
        }

        Account account = accountOpt.get();
        account.setIsLocked(false);
        account.setAttempts(0);
        accountRepository.save(account);

        log.info("Utilisateur {} débloqué", account.getUsername());

        return AuthResponse.builder()
                .username(account.getUsername())
                .message("Utilisateur débloqué avec succès")
                .build();
    }

    @Transactional
    public AuthResponse importUsersFromFirebase() {
        try {
            java.util.List<com.google.firebase.auth.UserRecord> firebaseUsers = firebaseService.getAllFirebaseUsers();
            
            if (firebaseUsers.isEmpty()) {
                return AuthResponse.builder()
                        .message("Aucun utilisateur Firebase trouvé")
                        .build();
            }

            // Récupérer le rôle "utilisateur" pour les imports
            Role defaultRole = roleRepository.findByLibelle(ROLE_UTILISATEUR)
                    .orElseThrow(() -> new RuntimeException("Rôle " + ROLE_UTILISATEUR + " non trouvé"));

            int importedCount = 0;
            int updatedCount = 0;

            for (com.google.firebase.auth.UserRecord firebaseUser : firebaseUsers) {
                String username = firebaseUser.getDisplayName();

                // Si pas de displayName, utiliser la partie email avant @
                if (username == null || username.isEmpty()) {
                    String email = firebaseUser.getEmail();
                    if (email != null && !email.isEmpty()) {
                        username = email.split("@")[0];
                    } else {
                        username = firebaseUser.getUid();
                    }
                }

                // Importer le statut de l'utilisateur depuis Firebase
                boolean isActive = !firebaseUser.isDisabled();
                boolean isLocked = firebaseUser.isDisabled();

                // Vérifier si l'utilisateur existe déjà
                Optional<Account> existingAccount = accountRepository.findByUsername(username);

                if (existingAccount.isPresent()) {
                    // Mettre à jour le statut bloqué si changé
                    Account account = existingAccount.get();
                    if (account.getIsLocked() != isLocked) {
                        account.setIsLocked(isLocked);
                        account.setIsActive(isActive);
                        if (!isLocked) {
                            account.setAttempts(0);
                        }
                        accountRepository.save(account);
                        updatedCount++;
                        log.info("Utilisateur {} mis à jour (bloqué: {})", username, isLocked);
                    }
                    continue;
                }

                // Créer un nouveau compte
                Account account = Account.builder()
                        .username(username)
                        .pwd(hashPassword(firebaseUser.getUid()))
                        .role(defaultRole)
                        .createdAt(Instant.now())
                        .isActive(isActive)
                        .isLocked(isLocked)
                        .attempts(0)
                        .build();

                accountRepository.save(account);
                importedCount++;
                log.info("Utilisateur {} importé depuis Firebase (actif: {}, bloqué: {})", username, isActive, isLocked);
            }

            return AuthResponse.builder()
                    .message("Import réussi: " + importedCount + " importés, " + updatedCount + " mis à jour")
                    .build();

        } catch (Exception e) {
            log.error("Erreur lors de l'import depuis Firebase: {}", e.getMessage());
            return AuthResponse.builder()
                    .message("Erreur lors de l'import: " + e.getMessage())
                    .build();
        }
    }
}
