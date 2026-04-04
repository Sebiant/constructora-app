-- Agregar restricción UNIQUE para evitar duplicados en cod_material
-- Esta consulta debe ejecutarse en la base de datos

-- Primero, eliminar posibles duplicados existentes
DELETE t1 FROM materiales t1
INNER JOIN materiales t2 
WHERE t1.id_material > t2.id_material 
AND t1.cod_material = t2.cod_material;

-- Luego agregar la restricción UNIQUE
ALTER TABLE materiales 
ADD UNIQUE KEY `uk_cod_material` (`cod_material`);
