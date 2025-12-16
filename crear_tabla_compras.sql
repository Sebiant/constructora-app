-- Tabla de compras (registro de gestión de compra por pedido)
CREATE TABLE IF NOT EXISTS provedores (
  id_provedor INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(50) NULL,
  email VARCHAR(255) NULL,
  whatsapp VARCHAR(50) NULL,
  direccion VARCHAR(255) NULL,
  contacto VARCHAR(255) NULL,

  estado TINYINT(1) NOT NULL DEFAULT 1,

  idusuario INT NULL,
  fechareg DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fechaupdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_provedores_nombre (nombre),
  INDEX idx_provedores_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS compras (
  id_compra INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT NOT NULL,
  id_provedor INT NOT NULL,

  fecha_compra DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  numero_factura VARCHAR(100) NULL,

  total DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  observaciones TEXT NULL,

  idusuario INT NULL,
  fechareg DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fechaupdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_compras_pedido (id_pedido),
  INDEX idx_compras_provedor (id_provedor),
  INDEX idx_compras_estado (estado),
  INDEX idx_compras_fecha (fecha_compra),

  CONSTRAINT fk_compras_pedido FOREIGN KEY (id_pedido)
    REFERENCES pedidos(id_pedido)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_compras_provedor FOREIGN KEY (id_provedor)
    REFERENCES provedores(id_provedor)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

 CREATE TABLE IF NOT EXISTS compras_provedores (
   id_compra INT NOT NULL,
   id_provedor INT NOT NULL,
   fechareg DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
   PRIMARY KEY (id_compra, id_provedor),
   INDEX idx_cp_id_provedor (id_provedor),
 
   CONSTRAINT fk_cp_compra FOREIGN KEY (id_compra)
     REFERENCES compras(id_compra)
     ON UPDATE CASCADE
     ON DELETE CASCADE,
 
   CONSTRAINT fk_cp_provedor FOREIGN KEY (id_provedor)
     REFERENCES provedores(id_provedor)
     ON UPDATE CASCADE
     ON DELETE RESTRICT
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Detalle de compras (ítems comprados por cada compra)
CREATE TABLE IF NOT EXISTS compras_detalle (
  id_compra_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_compra INT NOT NULL,
  id_det_pedido INT NULL,

  descripcion VARCHAR(255) NOT NULL,
  unidad VARCHAR(50) NULL,
  cantidad DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
  precio_unitario DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
  subtotal DECIMAL(14,2) NOT NULL DEFAULT 0.00,

  fechareg DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_compra_detalle_compra (id_compra),
  INDEX idx_compra_detalle_pedido_detalle (id_det_pedido),

  CONSTRAINT fk_compras_detalle_compra FOREIGN KEY (id_compra)
    REFERENCES compras(id_compra)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_compras_detalle_pedido_detalle FOREIGN KEY (id_det_pedido)
    REFERENCES pedidos_detalle(id_det_pedido)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
