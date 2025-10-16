<?php
namespace Src\Presupuestos\Infrastructure;

use Src\Presupuestos\Domain\Presupuesto;
use Src\Presupuestos\Domain\PresupuestoRepository;
use PDO;

class PresupuestoMySQLRepository implements PresupuestoRepository {
    private PDO $conn;

    public function __construct(PDO $conn) {
        $this->conn = $conn;
    }

    public function save(Presupuesto $presupuesto): Presupuesto {
        $sql = "INSERT INTO presupuestos (id_proyecto, fecha_creacion, monto_total)
                VALUES (:id_proyecto, :fecha_creacion, :monto_total)";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            'id_proyecto'    => $presupuesto->getIdProyecto(),
            'fecha_creacion' => $presupuesto->getFechaCreacion(),
            'monto_total'    => $presupuesto->getMonto()
        ]);

        $id = (int)$this->conn->lastInsertId();
        $presupuesto->setId($id);

        return $presupuesto;
    }

    public function getAll(): array {
        $query = "SELECT 
                        p.id_presupuesto,
                        p.id_proyecto,
                        pr.nombre AS nombre_proyecto,
                        p.fecha_creacion,
                        p.monto_total
                  FROM presupuestos p
                  INNER JOIN proyectos pr ON p.id_proyecto = pr.id_proyecto
                  ORDER BY p.fecha_creacion DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $result ?: [];
    }

    public function find(int $id): ?Presupuesto {
        return null;
    }

    public function update(Presupuesto $presupuesto): bool {
        return false;
    }

    public function delete(int $id): bool {
        return false;
    }

    public function getMaterialesConPrecios(): array {
        $query = "SELECT 
                    m.id_material,
                    m.cod_material,
                    CAST(m.nombremat AS CHAR) AS nombre_material,
                    tm.desc_tipo AS tipo_material,
                    u.unidesc AS unidad,
                    mp.valor AS precio_actual,
                    mp.fecha AS fecha_precio,
                    mp.id_mat_precio
                FROM materiales m
                INNER JOIN tipo_material tm ON m.id_tipo_material = tm.id_tipo_material
                INNER JOIN gr_unidad u ON m.idunidad = u.idunidad
                INNER JOIN material_precio mp ON m.id_material = mp.id_material
                WHERE m.idestado = 1 
                AND mp.estado = 1
                AND mp.id_mat_precio IN (
                    SELECT MAX(mp2.id_mat_precio) 
                    FROM material_precio mp2 
                    WHERE mp2.id_material = m.id_material 
                    AND mp2.estado = 1
                )
                ORDER BY m.cod_material";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $result ?: [];
    }

    public function validateImportMasive(array $data): array {
        $filas = [];
        $encabezado = true;

        // Obtener materiales con precios actuales
        $materiales = $this->getMaterialesConPrecios();
        $materialesMap = [];
        foreach ($materiales as $material) {
            $materialesMap[$material['cod_material']] = $material;
        }

        foreach ($data as $fila) {
            if ($encabezado) { 
                $encabezado = false; 
                continue;
            }

            // Mapeo de columnas del Excel
            $nombreProyecto = trim($fila[0] ?? '');
            $nombrePresupuesto = trim($fila[1] ?? '');
            $codigoCapitulo = trim($fila[2] ?? '');
            $codigoMaterial = trim($fila[3] ?? '');
            $cantidad = trim($fila[4] ?? '');
            $fecha = trim($fila[5] ?? '');

            // Saltar filas completamente vacías
            if (empty($nombreProyecto) && empty($codigoCapitulo) && empty($codigoMaterial)) {
                continue;
            }

            $errores = [];

            // Validaciones básicas
            if (empty($nombreProyecto)) {
                $errores[] = 'Nombre de proyecto requerido';
            }

            if (empty($nombrePresupuesto)) {
                $errores[] = 'Nombre de presupuesto requerido';
            }

            if (empty($codigoCapitulo)) {
                $errores[] = 'Código de capítulo requerido';
            } elseif (!is_numeric($codigoCapitulo)) {
                $errores[] = 'Código de capítulo debe ser numérico';
            }

            if (empty($codigoMaterial)) {
                $errores[] = 'Código de material requerido';
            } elseif (!isset($materialesMap[$codigoMaterial])) {
                $errores[] = 'Material no encontrado en base de datos';
            }

            if (empty($cantidad)) {
                $errores[] = 'Cantidad requerida';
            } elseif (!is_numeric($cantidad) || $cantidad <= 0) {
                $errores[] = 'Cantidad debe ser un número mayor a 0';
            }

            // Obtener información del material (aunque haya errores, para mostrar en previsualización)
            $nombreMaterial = 'No encontrado';
            $precioUnitario = 0;
            $unidad = 'N/A';
            $tipoMaterial = 'N/A';
            
            if (isset($materialesMap[$codigoMaterial])) {
                $material = $materialesMap[$codigoMaterial];
                $nombreMaterial = $material['nombre_material'];
                $precioUnitario = (float)$material['precio_actual'];
                $unidad = $material['unidad'];
                $tipoMaterial = $material['tipo_material'];
            }

            // Calcular valor total (aunque haya errores)
            $valorTotal = $precioUnitario * (float)$cantidad;

            $filas[] = [
                'proyecto' => $nombreProyecto,
                'presupuesto' => $nombrePresupuesto,
                'capitulo' => $codigoCapitulo,
                'material_codigo' => $codigoMaterial,
                'material_nombre' => $nombreMaterial,
                'tipo_material' => $tipoMaterial,
                'unidad' => $unidad,
                'cantidad' => $cantidad,
                'precio_unitario' => $precioUnitario,
                'valor_total' => $valorTotal,
                'fecha' => $fecha,
                'ok' => empty($errores),
                'errores' => $errores
            ];
        }

        return $filas;
    }
    
}