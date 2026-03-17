-- ============================================================
-- MIGRACIÓN: Permitir NULL en campos críticos de materiales
-- Fecha: 2026-03-17
-- Motivo: El módulo de importación masiva de Excel permite datos
--         incompletos (estado=0), pero la BD rechazaba NULL en
--         id_tipo_material, bloqueando la importación parcial.
-- ============================================================

-- Paso 1: Permitir NULL en id_tipo_material
-- Antes: `id_tipo_material` int(11) NOT NULL
-- Después: `id_tipo_material` int(11) DEFAULT NULL
ALTER TABLE `materiales`
    MODIFY COLUMN `id_tipo_material` int(11) DEFAULT NULL COMMENT 'NULL indica que el tipo está pendiente de asignar (registro incompleto)';

-- Paso 2: Asegurar que idunidad también permite NULL (por consistencia, ya debería)
-- Si ya es NULL, esta línea no cambia nada; si fuera NOT NULL la corrige.
ALTER TABLE `materiales`
    MODIFY COLUMN `idunidad` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'NULL indica que la unidad está pendiente de asignar (registro incompleto)';

-- Paso 3: (Opcional - Agrega columna de notas de importación si no existe)
-- Permite registrar el motivo por el que un material quedó incompleto
ALTER TABLE `materiales`
    ADD COLUMN IF NOT EXISTS `notas_importacion` text DEFAULT NULL 
    COMMENT 'Notas sobre datos pendientes cuando se importa desde Excel con datos incompletos';

-- Verificación final: mostrar la estructura actualizada
DESCRIBE `materiales`;
