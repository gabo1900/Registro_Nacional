#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE ARRANQUE COMPLETO - REGISTRO NACIONAL DE HINCHAS (RNH CHILE)
# Backend Hexagonal en Quarkus (Puerto 9999) + Frontend React Vite (Puerto 5173)
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "======================================================================"
echo "  INICIANDO SISTEMA REGISTRO NACIONAL DE HINCHAS (RNH) - ANFP CHILE   "
echo "======================================================================"

# 1. Verificar PostgreSQL
echo -n "[1/3] Verificando PostgreSQL... "
if pg_isready -q; then
    echo "OK (PostgreSQL activo)"
else
    echo "ERROR: PostgreSQL no está respondiendo en localhost:5432."
    echo "Por favor inicia el servicio de PostgreSQL antes de continuar."
    exit 1
fi

# 2. Iniciar Backend Quarkus
echo "[2/3] Iniciando Backend Hexagonal Quarkus en puerto 9999..."
cd "$DIR/backend"
if [ -f "$DIR/backend/target/quarkus-app/quarkus-run.jar" ]; then
    java -jar "$DIR/backend/target/quarkus-app/quarkus-run.jar" > "$DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
else
    ./mvnw compile quarkus:dev > "$DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
fi
echo "      Backend corriendo con PID: $BACKEND_PID (logs en backend.log)"

# Esperar a que el backend esté listo
echo -n "      Esperando disponibilidad de http://localhost:9999/api/public/health... "
for i in {1..20}; do
    if curl -s http://localhost:9999/api/public/health | grep -q "RNH"; then
        echo "¡Listo!"
        break
    fi
    sleep 0.5
done

# 3. Iniciar Frontend Vite
echo "[3/3] Iniciando Frontend React (Vite) en http://localhost:5173..."
cd "$DIR/frontend"

cleanup() {
    echo ""
    echo "Deteniendo servicios..."
    kill $BACKEND_PID 2>/dev/null || true
    echo "Servicios detenidos."
    exit 0
}

trap cleanup INT TERM

echo ""
echo "======================================================================"
echo "  SISTEMA RNH CHILE EJECUTÁNDOSE CON ÉXITO                            "
echo "  • Frontend: http://localhost:5173                                  "
echo "  • Backend API: http://localhost:9999                               "
echo "  • SuperAdmin: yanezgabriel787@gmail.com / clave: 1234               "
echo "======================================================================"
echo "Presiona Ctrl+C en cualquier momento para detener todos los servicios."
echo ""

npm run dev
