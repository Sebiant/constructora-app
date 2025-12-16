SET FOREIGN_KEY_CHECKS = 0;

-- =====================
-- COMPRAS (HIJOS)
-- =====================
DELETE FROM compras_detalle;
DELETE FROM compras;
DELETE FROM compras_provedores;

-- =====================
-- PEDIDOS (PADRES)
-- =====================
DELETE FROM pedidos_detalle;
DELETE FROM materiales_extra_presupuesto;
DELETE FROM pedidos;

-- =====================
-- AUTO_INCREMENT
-- =====================
ALTER TABLE compras_detalle AUTO_INCREMENT = 1;
ALTER TABLE compras AUTO_INCREMENT = 1;
ALTER TABLE compras_provedores AUTO_INCREMENT = 1;

ALTER TABLE pedidos_detalle AUTO_INCREMENT = 1;
ALTER TABLE materiales_extra_presupuesto AUTO_INCREMENT = 1;
ALTER TABLE pedidos AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;
