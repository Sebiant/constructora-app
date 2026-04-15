-- ============================================================
-- TABLA: presupuesto_carrito
-- Descripción: Persistencia en BD del carrito de pedido por
--              presupuesto. Cada presupuesto tiene su propio
--              carrito independiente (una fila por componente+item).
--              Reemplaza el uso de localStorage.
-- ============================================================

CREATE TABLE IF NOT EXISTS `presupuesto_carrito` (
  `id_carrito`        INT(11)        NOT NULL AUTO_INCREMENT,
  `id_presupuesto`    INT(11)        NOT NULL COMMENT 'Presupuesto al que pertenece este carrito',
  `id_componente`     INT(11)        NOT NULL COMMENT 'Componente (material/mano de obra) pedido',
  `id_item`           INT(11)        DEFAULT NULL COMMENT 'Item del presupuesto que genera la necesidad (NULL = componente sin desglose)',
  `cantidad`          DECIMAL(14,4)  NOT NULL DEFAULT 0.0000 COMMENT 'Cantidad actualmente en carrito',
  `tipo_vista`        ENUM('agrupada','individual') NOT NULL DEFAULT 'agrupada' COMMENT 'Vista en la que se registró el pedido',
  `idusuario`         INT(11)        DEFAULT NULL COMMENT 'Usuario que modificó el carrito por última vez',
  `fechareg`          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaupdate`       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_carrito`),
  -- Un componente+item es único por presupuesto (UPSERT seguro)
  UNIQUE KEY `uq_carrito_presupuesto_comp_item` (`id_presupuesto`, `id_componente`, `id_item`),
  KEY `idx_carrito_presupuesto` (`id_presupuesto`),
  KEY `idx_carrito_componente`  (`id_componente`),
  CONSTRAINT `fk_carrito_presupuesto`
    FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuestos` (`id_presupuesto`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Carrito temporal de pedido por presupuesto. Reemplaza localStorage.';


-- ============================================================
-- TABLA: presupuesto_carrito_extra
-- Descripción: Materiales extra (fuera del presupuesto base)
--              que el usuario agrega al carrito.
-- ============================================================

CREATE TABLE IF NOT EXISTS `presupuesto_carrito_extra` (
  `id_carrito_extra`  INT(11)        NOT NULL AUTO_INCREMENT,
  `id_presupuesto`    INT(11)        NOT NULL,
  `tipo`              ENUM('material_extra','pedido_fuera') NOT NULL DEFAULT 'material_extra'
                        COMMENT 'material_extra = material no en presupuesto; pedido_fuera = excedente de presupuesto',
  `id_material`       INT(11)        DEFAULT NULL COMMENT 'Si aplica (material_extra)',
  `id_componente`     INT(11)        DEFAULT NULL COMMENT 'Si aplica (pedido_fuera)',
  `id_item`           INT(11)        DEFAULT NULL COMMENT 'Item de origen (pedido_fuera)',
  `descripcion`       VARCHAR(500)   NOT NULL,
  `codigo`            VARCHAR(100)   DEFAULT NULL,
  `unidad`            VARCHAR(50)    DEFAULT 'UND',
  `cantidad`          DECIMAL(14,4)  NOT NULL DEFAULT 0.0000,
  `precio_unitario`   DECIMAL(14,4)  NOT NULL DEFAULT 0.0000,
  `justificacion`     TEXT           DEFAULT NULL,
  `datos_json`        JSON           DEFAULT NULL COMMENT 'Datos adicionales originales en JSON',
  `idusuario`         INT(11)        DEFAULT NULL,
  `fechareg`          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaupdate`       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_carrito_extra`),
  KEY `idx_carrito_extra_presupuesto` (`id_presupuesto`),
  CONSTRAINT `fk_carrito_extra_presupuesto`
    FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuestos` (`id_presupuesto`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Materiales extra y pedidos fuera de presupuesto del carrito.';
