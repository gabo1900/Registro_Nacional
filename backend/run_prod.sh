#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE ARRANQUE EN PRODUCCIÓN - BACKEND QUARKUS RNH
# Carga automáticamente el archivo .env e inyecta las credenciales a Java
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# 1. Cargar variables desde .env si existe
if [ -f "$DIR/.env" ]; then
    set -a
    source "$DIR/.env"
    set +a
    echo "✓ Archivo .env cargado correctamente."
fi

# 2. Valores con fallback
PORT="${PORT:-9995}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-rnh_db}"

JAR_FILE="$DIR/target/quarkus-app/quarkus-run.jar"

if [ ! -f "$JAR_FILE" ]; then
    echo "ERROR: No se encontró el archivo $JAR_FILE"
    echo "Ejecuta primero: ./mvnw package -DskipTests"
    exit 1
fi

echo "======================================================================"
echo "  INICIANDO RNH BACKEND EN MODO PRODUCCIÓN (JAR)                      "
echo "  • Puerto HTTP: $PORT                                               "
echo "  • Base de Datos: $DB_NAME en $DB_HOST:$DB_PORT                     "
echo "  • Usuario BD: $DB_USER                                             "
echo "======================================================================"

exec java \
  -Dquarkus.http.host=0.0.0.0 \
  -Dquarkus.http.port="$PORT" \
  -Dquarkus.datasource.jdbc.url="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}" \
  -Dquarkus.datasource.username="$DB_USER" \
  -Dquarkus.datasource.password="$DB_PASSWORD" \
  -jar "$JAR_FILE"
