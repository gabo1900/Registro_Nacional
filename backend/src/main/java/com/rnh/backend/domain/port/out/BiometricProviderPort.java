package com.rnh.backend.domain.port.out;

import com.rnh.backend.domain.vo.VectorBiometricoRef;

/**
 * Puerto de Salida Hexagonal hacia el proveedor biométrico externo (Entidad de Fútbol / ANFP).
 * Cumple Zero-Retention: las fotografías en crudo se procesan en memoria y solo se retorna el vector/token cifrado.
 */
public interface BiometricProviderPort {

    VectorBiometricoRef registrarRostroYDocumento(
            String documentoId,
            String fotoDocumentoBase64,
            String selfieBase64,
            String descriptorClienteJson
    );

    double verificarIdentidadEnPuerta(
            String biometricTokenRef,
            String vectorAlmacenadoCifrado,
            String capturaEnVivoBase64,
            String descriptorCapturaJson
    );
}
