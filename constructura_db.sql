DROP DATABASE IF EXISTS constructora_db;
CREATE DATABASE constructora_db;
USE constructora_db;

CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nit VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    estado BOOLEAN DEFAULT TRUE
);

CREATE TABLE proyectos (
    id_proyecto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    id_cliente INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estado BOOLEAN DEFAULT TRUE,
    observaciones TEXT,
    CONSTRAINT fk_proyecto_cliente FOREIGN KEY (id_cliente) 
        REFERENCES clientes(id_cliente) ON DELETE RESTRICT
);

CREATE TABLE resp_proyecto (
    id_resp_proyecto INT AUTO_INCREMENT PRIMARY KEY,
    id_proyecto INT NOT NULL,
    id_usuario INT NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_resp_proyecto FOREIGN KEY (id_proyecto) 
        REFERENCES proyectos(id_proyecto) ON DELETE CASCADE
);

CREATE TABLE capitulos (
    id_capitulo INT AUTO_INCREMENT PRIMARY KEY,
    id_proyecto INT NOT NULL,
    nombre_cap VARCHAR(200) NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_cap_proyecto FOREIGN KEY (id_proyecto) 
        REFERENCES proyectos(id_proyecto) ON DELETE CASCADE
);

CREATE TABLE presupuestos (
    id_presupuesto INT AUTO_INCREMENT PRIMARY KEY,
    id_proyecto INT NOT NULL,
    fecha_creacion DATE NOT NULL,
    monto_total DECIMAL(14,2) DEFAULT 0,
    CONSTRAINT fk_presup_proyecto FOREIGN KEY (id_proyecto) 
        REFERENCES proyectos(id_proyecto) ON DELETE CASCADE
);

CREATE TABLE tipo_material (
    id_tipo_material INT AUTO_INCREMENT PRIMARY KEY,
    desc_tipo VARCHAR(150) NOT NULL,
    estado BOOLEAN DEFAULT TRUE
);

CREATE TABLE materiales (
    id_material INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    id_tipo_material INT NOT NULL,
    unidad_med VARCHAR(50),
    CONSTRAINT fk_material_tipo FOREIGN KEY (id_tipo_material) 
        REFERENCES tipo_material(id_tipo_material)
);

CREATE TABLE material_precio (
    id_mat_precio INT AUTO_INCREMENT PRIMARY KEY,
    id_material INT NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    fecha DATE NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_mat_precio_material FOREIGN KEY (id_material) 
        REFERENCES materiales(id_material) ON DELETE CASCADE
);

CREATE TABLE det_presupuesto (
    id_det_presupuesto INT AUTO_INCREMENT PRIMARY KEY,
    id_presupuesto INT NOT NULL,
    id_material INT NOT NULL,
    id_capitulo INT NOT NULL,
    id_mat_precio INT NOT NULL,
    cantidad DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_det_presupuesto FOREIGN KEY (id_presupuesto) 
        REFERENCES presupuestos(id_presupuesto) ON DELETE CASCADE,
    CONSTRAINT fk_det_material FOREIGN KEY (id_material) 
        REFERENCES materiales(id_material),
    CONSTRAINT fk_det_capitulo FOREIGN KEY (id_capitulo) 
        REFERENCES capitulos(id_capitulo) ON DELETE CASCADE,
    CONSTRAINT fk_det_mat_precio FOREIGN KEY (id_mat_precio) 
        REFERENCES material_precio(id_mat_precio)
);