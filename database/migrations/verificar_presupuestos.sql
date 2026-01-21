-- Script para verificar el estado actual de los presupuestos
-- Ejecutar este script para ver qué datos hay actualmente

SELECT 
    id_presupuesto,
    codigo,
    nombre,
    id_proyecto,
    fecha_creacion,
    monto_total,
    fupdate
FROM presupuestos 
ORDER BY id_presupuesto;

-- Verificar si hay valores NULL en los campos nuevos
SELECT 
    COUNT(*) as total_presupuestos,
    COUNT(codigo) as con_codigo,
    COUNT(nombre) as con_nombre,
    COUNT(*) - COUNT(codigo) as sin_codigo,
    COUNT(*) - COUNT(nombre) as sin_nombre
FROM presupuestos;
