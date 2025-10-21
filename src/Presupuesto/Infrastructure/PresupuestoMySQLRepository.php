<?php
namespace Src\Presupuesto\Infrastructure;

use Src\Presupuesto\Domain\Presupuesto;
use Src\Presupuesto\Domain\PresupuestoRepository;
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

    // 🔴 REEMPLAZADO: Nuevo método para validar capítulos
    public function validarCapituloParaProyecto(int $idCapitulo, int $idProyecto): ?array {
        $query = "SELECT 
                    c.id_capitulo,
                    c.nombre_cap,
                    c.id_presupuesto,
                    p.id_proyecto
                FROM capitulos c
                INNER JOIN presupuestos p ON c.id_presupuesto = p.id_presupuesto
                WHERE c.id_capitulo = :id_capitulo 
                AND p.id_proyecto = :id_proyecto
                AND c.estado = 1
                LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            'id_capitulo' => $idCapitulo,
            'id_proyecto' => $idProyecto
        ]);

        $capitulo = $stmt->fetch(PDO::FETCH_ASSOC);
        return $capitulo ?: null;
    }

    
    public function validateImportMasive(array $data, ?string $proyectoSeleccionado = null): array {
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
            $codigoCapitulo = trim($fila[1] ?? '');
            $codigoMaterial = trim($fila[2] ?? '');
            $cantidad = trim($fila[3] ?? '');
            $fecha = trim($fila[4] ?? '');
            $nombrePresupuesto = trim($fila[0] ?? '');

            // Saltar filas completamente vacías
            if (empty($codigoCapitulo) && empty($codigoMaterial)) {
                continue;
            }

            $errores = [];
            $idCapitulo = null;
            $nombreCapitulo = 'Capítulo no válido';

            // Validaciones básicas
            if (empty($proyectoSeleccionado)) {
                $errores[] = 'Proyecto no seleccionado';
            }

            if (empty($nombrePresupuesto)) {
                $errores[] = 'Nombre de presupuesto requerido';
            }

            // 🔴 CORREGIDO: Validación de capítulos
            if (empty($codigoCapitulo)) {
                $errores[] = 'ID de capítulo requerido';
            } elseif (!is_numeric($codigoCapitulo)) {
                $errores[] = 'ID de capítulo debe ser numérico';
            } else {
                // Validar que el capítulo pertenece al proyecto
                $capituloValido = $this->validarCapituloParaProyecto((int)$codigoCapitulo, (int)$proyectoSeleccionado);
                if (!$capituloValido) {
                    $errores[] = 'El capítulo no existe o no pertenece a este proyecto';
                } else {
                    $idCapitulo = $capituloValido['id_capitulo'];
                    $nombreCapitulo = $capituloValido['nombre_cap'];
                }
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

            // Obtener info del material (aunque haya errores)
            $nombreMaterial = 'No encontrado';
            $precioUnitario = 0;
            $unidad = 'N/A';
            $tipoMaterial = 'N/A';
            $idMaterial = null;
            $idMatPrecio = null;
            
            if (isset($materialesMap[$codigoMaterial])) {
                $material = $materialesMap[$codigoMaterial];
                $nombreMaterial = $material['nombre_material'];
                $precioUnitario = (float)$material['precio_actual'];
                $unidad = $material['unidad'];
                $tipoMaterial = $material['tipo_material'];
                $idMaterial = $material['id_material'];
                $idMatPrecio = $material['id_mat_precio'];
            }

            $valorTotal = $precioUnitario * (float)$cantidad;

            $filas[] = [
                // --- Datos para mostrar ---
                'presupuesto' => $nombrePresupuesto,
                'capitulo' => $nombreCapitulo, // 🔴 Ahora muestra el nombre, no el ID
                'material_codigo' => $codigoMaterial,
                'material_nombre' => $nombreMaterial,
                'tipo_material' => $tipoMaterial,
                'unidad' => $unidad,
                'cantidad' => (float)$cantidad,
                'precio_unitario' => (float)$precioUnitario,
                'valor_total' => $valorTotal,
                'fecha' => $fecha,

                // --- Datos para la BD ---
                'id_det_presupuesto' => null,
                'id_presupuesto' => $idPresupuesto ?? null,
                'id_material' => $idMaterial,
                'id_capitulo' => $idCapitulo, // 🔴 Ahora tiene el ID válido o null
                'id_mat_precio' => $idMatPrecio,
                'idestado' => 1,
                'idusuario' => $idUsuario ?? 1,
                'fechareg' => date('Y-m-d H:i:s'),
                'fechaupdate' => date('Y-m-d H:i:s'),

                // --- Campos adicionales para control ---
                'id_proyecto' => $proyectoSeleccionado,
                'precio_actual' => (float)$precioUnitario,
                'valor_total_calculado' => $valorTotal,

                // --- Estado de validación ---
                'ok' => empty($errores),
                'errores' => $errores
            ];
        }

        return $filas;
    }   
}