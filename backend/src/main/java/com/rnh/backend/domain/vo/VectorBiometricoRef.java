package com.rnh.backend.domain.vo;

import java.util.Objects;

/**
 * Value Object inmutable que representa la referencia tokenizada al vector biométrico.
 * Cumple con Zero-Retention de imágenes crudas en el dominio.
 */
public final class VectorBiometricoRef {

    private final String tokenReferencia;
    private final String vectorCifrado;
    private final boolean livenessSuperado;
    private final double livenessScore;

    public VectorBiometricoRef(String tokenReferencia, String vectorCifrado, boolean livenessSuperado, double livenessScore) {
        if (!livenessSuperado) {
            throw new IllegalArgumentException("La prueba de vida (Liveness Detection) es obligatoria para generar un vector biométrico válido.");
        }
        this.tokenReferencia = Objects.requireNonNull(tokenReferencia, "El token de referencia biométrica no puede ser nulo.");
        this.vectorCifrado = vectorCifrado;
        this.livenessSuperado = livenessSuperado;
        this.livenessScore = livenessScore;
    }

    public String getTokenReferencia() {
        return tokenReferencia;
    }

    public String getVectorCifrado() {
        return vectorCifrado;
    }

    public boolean isLivenessSuperado() {
        return livenessSuperado;
    }

    public double getLivenessScore() {
        return livenessScore;
    }
}
