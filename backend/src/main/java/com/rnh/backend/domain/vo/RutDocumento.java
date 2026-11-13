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

    public String getValorEnmascarado() {
        if (valorNormalizado.length() <= 4) {
            return "***" + valorNormalizado;
        }
        String inicio = valorNormalizado.substring(0, Math.min(3, valorNormalizado.length() - 2));
        String dv = valorNormalizado.substring(valorNormalizado.length() - 1);
        return inicio + ".***-".concat(dv);
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
