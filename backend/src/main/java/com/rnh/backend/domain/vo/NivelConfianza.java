package com.rnh.backend.domain.vo;

/**
 * Value Object inmutable que evalúa el umbral de similitud biométrica (por defecto >= 0.88).
 */
public final class NivelConfianza {

    private final double similarityScore;
    private final double umbralMinimo;

    public NivelConfianza(double similarityScore, double umbralMinimo) {
        this.similarityScore = similarityScore;
        this.umbralMinimo = umbralMinimo;
    }

    public boolean esConfiable() {
        return similarityScore >= umbralMinimo;
    }

    public double getSimilarityScore() {
        return similarityScore;
    }

    public double getUmbralMinimo() {
        return umbralMinimo;
    }
}
