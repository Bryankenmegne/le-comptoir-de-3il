package com.ecommerce.config;

import com.ecommerce.dto.ErrorResponse;
import com.ecommerce.security.JwtFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

import java.io.IOException;

/**
 * Configuration de Spring Security :
 * - API sans état (pas de session, authentification par JWT)
 * - routes publiques en lecture, routes admin réservées au rôle ADMIN
 * - erreurs 401 / 403 renvoyées en JSON
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // active @PreAuthorize
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final ObjectMapper objectMapper;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        PathPatternRequestMatcher.Builder path = PathPatternRequestMatcher.withDefaults();

        http
                // Pas de cookie de session : la protection CSRF n'est pas nécessaire
                .csrf(AbstractHttpConfigurer::disable)
                // Utilise le bean corsConfigurationSource de CorsConfig
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // La console H2 s'affiche dans des iframes
                .headers(h -> h.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                .authorizeHttpRequests(auth -> auth
                        // Requêtes "preflight" CORS
                        .requestMatchers(path.matcher(HttpMethod.OPTIONS, "/**")).permitAll()
                        // Santé de l'API
                        .requestMatchers(path.matcher(HttpMethod.GET, "/")).permitAll()
                        .requestMatchers(path.matcher(HttpMethod.GET, "/api/health")).permitAll()
                        // Authentification (sauf /me qui exige un token)
                        .requestMatchers(path.matcher("/api/auth/me")).authenticated()
                        .requestMatchers(path.matcher("/api/auth/**")).permitAll()
                        // Catalogue en lecture seule
                        .requestMatchers(path.matcher(HttpMethod.GET, "/api/products/**")).permitAll()
                        .requestMatchers(path.matcher(HttpMethod.GET, "/api/categories/**")).permitAll()
                        // Console H2 (désactivable via H2_CONSOLE_ENABLED=false)
                        .requestMatchers(path.matcher("/h2-console/**")).permitAll()
                        .requestMatchers(path.matcher("/error")).permitAll()
                        // Administration
                        .requestMatchers(path.matcher("/api/admin/**")).hasRole("ADMIN")
                        // Tout le reste (commandes...) nécessite d'être connecté
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) ->
                                writeError(req, res, HttpStatus.UNAUTHORIZED,
                                        "Authentification requise : connectez-vous"))
                        .accessDeniedHandler((req, res, e) ->
                                writeError(req, res, HttpStatus.FORBIDDEN,
                                        "Accès refusé : droits insuffisants"))
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * AuthenticationManager construit automatiquement par Spring
     * à partir de CustomUserDetailsService et du PasswordEncoder.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * JwtFilter est un @Component : sans ceci, Spring Boot l'ajouterait
     * une seconde fois dans la chaîne de filtres du serveur.
     */
    @Bean
    public FilterRegistrationBean<JwtFilter> jwtFilterRegistration(JwtFilter filter) {
        FilterRegistrationBean<JwtFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    private void writeError(HttpServletRequest req, HttpServletResponse res,
                            HttpStatus status, String message) throws IOException {
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(res.getOutputStream(),
                ErrorResponse.of(status.value(), status.getReasonPhrase(), message, req.getRequestURI()));
    }
}
