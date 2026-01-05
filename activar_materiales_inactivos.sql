-- Script para activar todos los materiales que están inactivos
-- Esto corregirá el problema de que aparezcan como "pendientes de activación"

-- Paso 1: Verificar cuántos materiales están inactivos
SELECT 
    'MATERIALES INACTIVOS ANTES DE ACTIVACIÓN' AS estado,
    COUNT(*) AS total_inactivos
FROM materiales 
WHERE idestado = 0;

-- Paso 2: Mostrar los materiales inactivos
SELECT 
    id_material,
    cod_material,
    nombremat,
    idestado
FROM materiales 
WHERE idestado = 0
ORDER BY cod_material;

-- Paso 3: Activar todos los materiales inactivos
UPDATE materiales 
SET idestado = 1 
WHERE idestado = 0;

-- Paso 4: Verificar resultado después de la activación
SELECT 
    'MATERIALES DESPUÉS DE ACTIVACIÓN' AS estado,
    COUNT(*) AS total_materiales,
    SUM(CASE WHEN idestado = 1 THEN 1 ELSE 0 END) as activos,
    SUM(CASE WHEN idestado = 0 THEN 1 ELSE 0 END) as inactivos
FROM materiales;

-- Paso 5: Confirmar que no queden materiales inactivos
SELECT 
    'VERIFICACIÓN FINAL' AS estado,
    CASE 
        WHEN COUNT(*) = 0 THEN 'TODOS LOS MATERIALES ESTÁN ACTIVOS'
        ELSE CONCAT('AÚN HAY ', COUNT(*), ' MATERIALES INACTIVOS')
    END AS resultado
FROM materiales 
WHERE idestado = 0;
