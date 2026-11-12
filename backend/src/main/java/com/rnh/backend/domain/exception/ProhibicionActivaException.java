package com.rnh.backend.domain.exception;

public class ProhibicionActivaException extends RuntimeException {
    private final String codigoCausal;

    public ProhibicionActivaException(String message, String codigoCausal) {
        super(message);
        this.codigoCausal = codigoCausal;
    }

    public String getCodigoCausal() {
        return codigoCausal;
    }
}
