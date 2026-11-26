package dev.workingstate;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.json.JsonMapper;

@Configuration(proxyBeanMethods = false)
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
class WorkspaceSecurity {
    static final String SESSION = "/api/v1/session";
    private static final String INVALID_CREDENTIAL = "Supply an active agent credential.";

    @Bean
    Pbkdf2PasswordEncoder ownerPasswordEncoder() {
        return Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    }

    @Bean
    InMemoryUserDetailsManager owner(@Value("${workspace.owner.username}") String username,
                                     @Value("${workspace.owner.password}") String password,
                                     Pbkdf2PasswordEncoder encoder) {
        if (username.isBlank() || password.isBlank()) {
            throw new IllegalStateException("Set WORKSPACE_OWNER_USERNAME and WORKSPACE_OWNER_PASSWORD for owner sign-in");
        }
        return new InMemoryUserDetailsManager(User.withUsername(username)
                .password(encoder.encode(password))
                .roles("OWNER")
                .build());
    }

    @Bean
    @Order(1)
    SecurityFilterChain agentSecurity(HttpSecurity http, AgentCredentials credentials, JsonMapper json) throws Exception {
        http.securityMatcher(request -> request.getServletPath().startsWith("/api/")
                        && request.getHeader(HttpHeaders.AUTHORIZATION) != null)
                .sessionManagement(sessions -> sessions.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(AbstractHttpConfigurer::disable)
                .csrf(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(requests -> requests
                        .requestMatchers(SESSION, SESSION + "/logout").denyAll()
                        .anyRequest().hasRole("AGENT"))
                .exceptionHandling(errors -> errors.accessDeniedHandler((request, response, exception) ->
                        reject(response, json, HttpStatus.FORBIDDEN, "This operation requires an owner session.")))
                .addFilterBefore(new AgentBearerFilter(credentials, json), AnonymousAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    @Order(2)
    SecurityFilterChain browserSecurity(HttpSecurity http, JsonMapper json) throws Exception {
        http.authorizeHttpRequests(requests -> requests
                        .dispatcherTypeMatchers(DispatcherType.ERROR, DispatcherType.FORWARD).permitAll()
                        .requestMatchers(HttpMethod.GET, SESSION, "/api/v1/openapi.yaml").permitAll()
                        .requestMatchers("/api/**").hasRole("OWNER")
                        .anyRequest().permitAll())
                .requestCache(AbstractHttpConfigurer::disable)
                .formLogin(form -> form.loginPage("/")
                        .loginProcessingUrl(SESSION)
                        .successHandler((request, response, authentication) -> response.setStatus(204))
                        .failureHandler((request, response, exception) ->
                                reject(response, json, HttpStatus.UNAUTHORIZED, "Incorrect username or password."))
                        .permitAll())
                .logout(logout -> logout.logoutUrl(SESSION + "/logout")
                        .logoutSuccessHandler((request, response, authentication) -> response.setStatus(204)))
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) ->
                                reject(response, json, HttpStatus.UNAUTHORIZED, "Sign in to access the workspace."))
                        .accessDeniedHandler((request, response, exception) -> {
                            boolean login = request.getServletPath().equals(SESSION);
                            if (!login && SecurityContextHolder.getContext().getAuthentication() == null) {
                                reject(response, json, HttpStatus.UNAUTHORIZED, "Sign in to access the workspace.");
                            } else {
                                reject(response, json, HttpStatus.FORBIDDEN, "The session could not authorize this request.");
                            }
                        }));
        return http.build();
    }

    static void reject(HttpServletResponse response, JsonMapper json, HttpStatus status, String message)
            throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        json.writeValue(response.getOutputStream(), new ApiError(status, message));
    }

    private static final class AgentBearerFilter extends OncePerRequestFilter {
        private static final Pattern BEARER = Pattern.compile("(?i:Bearer) +(?<token>wst_[A-Za-z0-9_-]{43})");
        private final AgentCredentials credentials;
        private final JsonMapper json;

        private AgentBearerFilter(AgentCredentials credentials, JsonMapper json) {
            this.credentials = credentials;
            this.json = json;
        }

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                throws IOException, ServletException {
            var header = BEARER.matcher(request.getHeader(HttpHeaders.AUTHORIZATION));
            Optional<WorkspaceIdentity> identity = header.matches()
                    ? credentials.authenticate(header.group("token")) : Optional.empty();
            if (identity.isEmpty()) {
                response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
                reject(response, json, HttpStatus.UNAUTHORIZED, INVALID_CREDENTIAL);
                return;
            }
            var context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(identity.get(), null,
                    List.of(new SimpleGrantedAuthority("ROLE_AGENT"))));
            SecurityContextHolder.setContext(context);
            chain.doFilter(request, response);
        }
    }
}
