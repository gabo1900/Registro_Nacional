package com.rnh.backend.domain.vo;

import java.util.Objects;

/**
 * Value Object inmutable para validación y normalización de RUT chileno o Pasaporte.
 * Incluye verificación estricta de dígito verificador (Módulo 11) según norma del Registro Civil.
 */
public final class RutDocumento {

    private final String valorNormalizado;
    private final String tipoDocumento;

    public RutDocumento(String valorRaw, String tipoDocumento) {
        if (valorRaw == null || valorRaw.isBlank()) {
            throw new IllegalArgumentException("El número de documento (RUT/Pasaporte) es obligatorio.");
        }
        this.tipoDocumento = (tipoDocumento == null || tipoDocumento.isBlank()) ? "CEDULA_CHILE" : tipoDocumento.toUpperCase();
        String normalizado = normalizar(valorRaw);

        if ("CEDULA_CHILE".equalsIgnoreCase(this.tipoDocumento)) {
            if (!validarRutChileno(normalizado)) {
                throw new IllegalArgumentException("El RUT ingresado ('" + valorRaw + "') no es válido según el algoritmo del Registro Civil de Chile.");
            }
        } else if (normalizado.length() < 4) {
            throw new IllegalArgumentException("El número de pasaporte o documento ingresado es demasiado corto.");
        }

        this.valorNormalizado = normalizado;
    }

    public static String normalizar(String raw) {
        if (raw == null) return "";
        return raw.replace(".", "").replace("-", "").trim().toUpperCase();
    }

    /**
     * Valida el dígito verificador de un RUT chileno usando el algoritmo Módulo 11 oficial.
     */
    public static boolean validarRutChileno(String rutNormalizado) {
        if (rutNormalizado == null || rutNormalizado.isBlank()) return false;
        String clean = normalizar(rutNormalizado);
        if (clean.length() < 8 || clean.length() > 9) return false;

        try {
            String cuerpo = clean.substring(0, clean.length() - 1);
            char dvEntregado = clean.charAt(clean.length() - 1);

            int suma = 0;
            int factor = 2;
            for (int i = cuerpo.length() - 1; i >= 0; i--) {
                char c = cuerpo.charAt(i);
                if (!Character.isDigit(c)) return false;
                suma += (c - '0') * factor;
                factor = (factor == 7) ? 2 : factor + 1;
            }

            int resto = 11 - (suma % 11);
            char dvEsperado;
            if (resto == 11) {
                dvEsperado = '0';
            } else if (resto == 10) {
                dvEsperado = 'K';
            } else {
                dvEsperado = (char) ('0' + resto);
            }

            return dvEntregado == dvEsperado;
        } catch (Exception e) {
            return false;
        }
    }

    public String getValorNormalizado() {
        return valorNormalizado;
    }

    public String getTipoDocumento() {
        return tipoDocumento;
    }

    /**
     * Formato único en todo el sistema (debe coincidir con enmascararDocumento del frontend):
     * RUT 26.812.483-7 → 26.***.***-7 (solo los 2 primeros dígitos y el DV).
     * Pasaporte AB123456 → AB*****6.
     */
    public String getValorEnmascarado() {
        String v = valorNormalizado;
        if ("CEDULA_CHILE".equalsIgnoreCase(tipoDocumento) && v.length() >= 2) {
            String cuerpo = v.substring(0, v.length() - 1);
            String dv = v.substring(v.length() - 1);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < cuerpo.length(); i++) {
                int desdeFinal = cuerpo.length() - i;
                if (i > 0 && desdeFinal % 3 == 0) sb.append('.');
                sb.append(i < 2 ? cuerpo.charAt(i) : '*');
            }
            return sb + "-" + dv;
        }
        if (v.length() <= 3) return "*".repeat(v.length());
        return v.substring(0, 2) + "*".repeat(v.length() - 3) + v.substring(v.length() - 1);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RutDocumento that)) return false;
        return Objects.equals(valorNormalizado, that.valorNormalizado) &&
               Objects.equals(tipoDocumento, that.tipoDocumento);
    }

    @Override
    public int hashCode() {
        return Objects.hash(valorNormalizado, tipoDocumento);
    }
}
