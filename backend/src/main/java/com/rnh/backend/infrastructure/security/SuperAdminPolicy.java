package com.rnh.backend.infrastructure.security;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Única fuente de verdad para decidir qué correos son SUPER_ADMIN.
 *
 * La comparación es EXACTA (correo completo, sin espacios, sin distinguir mayúsculas):
 * "yanezgabriel787@gmail.com" NO coincide con "yanezgabriel78910@gmail.com" ni con
 * "yanezgabriel@gmail.com". No se usan prefijos, "contains" ni comodines.
 *
 * La lista se define en application.properties (rnh.security.super-admin-emails)
 * o con la variable de entorno RNH_SUPER_ADMIN_EMAILS, separada por comas.
 */
@ApplicationScoped
public class SuperAdminPolicy {

    private final Set<String> correos;

    public SuperAdminPolicy(
            @ConfigProperty(name = "rnh.security.super-admin-emails",
                    defaultValue = "yanezgabriel787@gmail.com,yanezgabriel3416@gmail.com") String lista
    ) {
        this.correos = Arrays.stream(lista.split(","))
                .map(SuperAdminPolicy::normalizar)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }

    public boolean esSuperAdmin(String email) {
        return email != null && correos.contains(normalizar(email));
    }

    public Set<String> correos() {
        return correos;
    }

    private static String normalizar(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
