-- ============================================
-- Script para eliminar TODOS los pedidos
-- Base de datos: gesconjm_sgicontrol
-- ============================================

-- Desactivar verificación de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Eliminar todos los detalles de pedidos (pedidos_detalle)
-- Esto incluye tanto pedidos presupuestados (es_excedente = 0) 
-- como excedentes (es_excedente = 1)
DELETE FROM pedidos_detalle;

-- 2. Eliminar todos los pedidos (pedidos)
DELETE FROM pedidos;

-- 3. Eliminar todos los materiales extra (fuera de presupuesto)
DELETE FROM materiales_extra_presupuesto;

-- 4. Reiniciar los auto_increment para que los IDs empiecen desde 1
ALTER TABLE pedidos_detalle AUTO_INCREMENT = 1;
ALTER TABLE pedidos AUTO_INCREMENT = 1;
ALTER TABLE materiales_extra_presupuesto AUTO_INCREMENT = 1;

-- Reactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar que se eliminaron correctamente
SELECT 'Pedidos restantes:' as Verificacion, COUNT(*) as Total FROM pedidos;
SELECT 'Detalles de pedidos restantes:' as Verificacion, COUNT(*) as Total FROM pedidos_detalle;
SELECT 'Materiales extra restantes:' as Verificacion, COUNT(*) as Total FROM materiales_extra_presupuesto;

-- ============================================
-- RESULTADO ESPERADO:
-- Las 3 consultas deben mostrar 0 registros
-- ============================================
