package com.rnh.backend.domain.vo;

import java.util.Objects;

/**
 * Value Object inmutable para validación y normalización de RUT chileno o Pasaporte.
 */
public final class RutDocumento {

    private final String valorNormalizado;
    private final String tipoDocumento;

    public RutDocumento(String valorRaw, String tipoDocumento) {
        if (valorRaw == null || valorRaw.isBlank()) {
            throw new IllegalArgumentException("El número de documento (RUT/Pasaporte) es obligatorio.");
        }
        this.tipoDocumento = (tipoDocumento == null || tipoDocumento.isBlank()) ? "CEDULA_CHILE" : tipoDocumento.toUpperCase();
        this.valorNormalizado = normalizar(valorRaw);
    }

    public static String normalizar(String raw) {
        if (raw == null) return "";
        return raw.replace(".", "").replace("-", "").trim().toUpperCase();
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
