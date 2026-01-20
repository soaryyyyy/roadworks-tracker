package itu.cloud.roadworks.api;

import itu.cloud.roadworks.dto.AuthResponse;
import itu.cloud.roadworks.dto.LoginRequest;
import itu.cloud.roadworks.dto.RegisterRequest;
import itu.cloud.roadworks.model.Account;
import itu.cloud.roadworks.model.Role;
import itu.cloud.roadworks.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthApi {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        AuthResponse response = authService.login(request, ipAddress, userAgent);

        if (response.getToken() == null) {
            return ResponseEntity.badRequest().body(response);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);

        if (response.getToken() == null && response.getUsername() == null) {
            return ResponseEntity.badRequest().body(response);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String token) {
        String cleanToken = token.replace("Bearer ", "");
        authService.logout(cleanToken);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/validate")
    public ResponseEntity<AuthResponse> validateToken(@RequestHeader("Authorization") String token) {
        String cleanToken = token.replace("Bearer ", "");

        return authService.validateToken(cleanToken)
                .map(account -> ResponseEntity.ok(AuthResponse.builder()
                        .username(account.getUsername())
                        .role(account.getRole().getLibelle())
                        .token(cleanToken)
                        .message("Token valide")
                        .build()))
                .orElse(ResponseEntity.status(401).body(AuthResponse.builder()
                        .message("Token invalide ou expiré")
                        .build()));
    }

    @GetMapping("/roles")
    public ResponseEntity<List<Map<String, Object>>> getRoles() {
        List<Role> roles = authService.getAllRoles();
        List<Map<String, Object>> result = roles.stream()
                .map(role -> Map.<String, Object>of(
                        "id", role.getId(),
                        "libelle", role.getLibelle()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        List<Account> accounts = authService.getAllUsers();
        List<Map<String, Object>> result = accounts.stream()
                .map(account -> Map.<String, Object>of(
                        "id", account.getId(),
                        "username", account.getUsername(),
                        "role", account.getRole().getLibelle(),
                        "isActive", account.getIsActive(),
                        "isLocked", account.getIsLocked(),
                        "createdAt", account.getCreatedAt().toString()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
