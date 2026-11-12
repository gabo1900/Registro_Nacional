package com.rnh.backend.infrastructure.adapter.in.rest;

import com.rnh.backend.domain.exception.ConsentimientoFaltanteException;
import com.rnh.backend.domain.exception.ProhibicionActivaException;
import com.rnh.backend.domain.exception.TenantIsolationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.time.LocalDateTime;
import java.util.Map;

@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Throwable> {

    @Override
    public Response toResponse(Throwable exception) {
        int status = 400;
        String errorCode = "VALIDATION_ERROR";

        if (exception instanceof SecurityException) {
            status = 401;
            errorCode = "UNAUTHORIZED";
        } else if (exception instanceof TenantIsolationException) {
            status = 403;
            errorCode = "TENANT_ISOLATION_VIOLATION";
        } else if (exception instanceof ConsentimientoFaltanteException) {
            status = 422;
            errorCode = "CONSENTIMIENTO_LEGAL_REQUERIDO";
        } else if (exception instanceof ProhibicionActivaException) {
            status = 403;
            errorCode = "DERECHO_ADMISION_ACTIVO";
        } else if (exception instanceof IllegalArgumentException || exception instanceof IllegalStateException) {
            status = 400;
            errorCode = "BUSINESS_RULE_ERROR";
        } else {
            status = 500;
            errorCode = "INTERNAL_SERVER_ERROR";
        }

        String msg = exception.getMessage() != null ? exception.getMessage() : "Error procesando la solicitud en el servidor RNH.";
        return Response.status(status)
                .type(MediaType.APPLICATION_JSON)
                .entity(Map.of(
                        "error", true,
                        "code", errorCode,
                        "message", msg,
                        "timestamp", LocalDateTime.now().toString()
                ))
                .build();
    }
}
