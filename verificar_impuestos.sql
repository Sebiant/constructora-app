-- Verificar impuestos configurados en los materiales
SELECT 
    m.id_material,
    m.nombremat,
    m.impuesto,
    ic.descripcion,
    ic.id_componente
FROM materiales m
JOIN item_componentes ic ON ic.id_material = m.id_material
WHERE ic.descripcion LIKE '%ALAMBRE%' OR ic.descripcion LIKE '%CARRETA%'
ORDER BY m.nombremat;

-- Si los impuestos son 0 o NULL, actualizarlos con 19%
UPDATE materiales m 
JOIN item_componentes ic ON ic.id_material = m.id_material 
SET m.impuesto = 19.00 
WHERE ic.descripcion LIKE '%ALAMBRE%' OR ic.descripcion LIKE '%CARRETA%';

-- Verificar después de actualizar
SELECT 
    m.id_material,
    m.nombremat,
    m.impuesto,
    ic.descripcion,
    ic.id_componente
FROM materiales m
JOIN item_componentes ic ON ic.id_material = m.id_material
WHERE ic.descripcion LIKE '%ALAMBRE%' OR ic.descripcion LIKE '%CARRETA%'
ORDER BY m.nombremat;
