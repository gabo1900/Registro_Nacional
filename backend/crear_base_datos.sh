#!/usr/bin/env bash
# ==============================================================================
# SCRIPT AUTOMÁTICO: CREACIÓN DE LA BASE DE DATOS Y TABLAS (rnh_db)
# ==============================================================================

set -e

DB_NAME="rnh_db"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "======================================================================"
echo "  CREANDO Y CONFIGURANDO BASE DE DATOS: $DB_NAME"
echo "======================================================================"

# 1. Crear la base de datos si no existe
echo -n "• Verificando si existe la base de datos '$DB_NAME'... "
if PGPASSWORD="${DB_PASSWORD:-postgres}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "Ya existe."
else
    echo "No existe. Creándola ahora..."
    PGPASSWORD="${DB_PASSWORD:-postgres}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME WITH ENCODING 'UTF8';"
    echo "✓ Base de datos '$DB_NAME' creada con éxito."
fi

# 2. Aplicar el esquema completo con todas las tablas e inserts iniciales
echo "• Aplicando tablas, foreign keys e índices desde database_schema.sql..."
PGPASSWORD="${DB_PASSWORD:-postgres}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/database_schema.sql"

echo ""
echo "======================================================================"
echo "✓ Base de datos '$DB_NAME' completamente configurada y lista."
echo "  - Tablas: tenants, usuarios, hinchas, huellas_biometricas,"
echo "            consentimientos_legales, prohibiciones_ingreso,"
echo "            accesos_log, solicitudes_arco"
echo "  - SuperAdmin: yanezgabriel787@gmail.com (clave: 1234)"
echo "======================================================================"
