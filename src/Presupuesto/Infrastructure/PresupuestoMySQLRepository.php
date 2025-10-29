<?php
namespace Src\Presupuesto\Infrastructure;

use Src\Presupuesto\Domain\Presupuesto;
use Src\Presupuesto\Domain\PresupuestoRepository;
use PDO;
use Exception;

class PresupuestoMySQLRepository implements PresupuestoRepository {
    private PDO $conn;

    public function __construct(PDO $conn) {
        $this->conn = $conn;
    }

    public function save(Presupuesto $presupuesto): Presupuesto {
        $sql = "INSERT INTO presupuestos (id_proyecto, fecha_creacion, monto_total, idusuario, fchreg, idestado, fupdate)
                VALUES (:id_proyecto, :fecha_creacion, :monto_total, :idusuario, NOW(), 1, NOW())";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            'id_proyecto'    => $presupuesto->getIdProyecto(),
            'fecha_creacion' => $presupuesto->getFechaCreacion(),
            'monto_total'    => $presupuesto->getMonto(),
            'idusuario'      => $presupuesto->getIdUsuario()
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
                WHERE p.idestado = 1
                ORDER BY p.fecha_creacion DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $result ?: [];
    }

    public function find(int $id): ?Presupuesto {
        $query = "SELECT 
                    p.id_presupuesto,
                    p.id_proyecto,
                    p.fecha_creacion,
                    p.monto_total,
                    pr.nombre AS nombre_proyecto
                FROM presupuestos p
                INNER JOIN proyectos pr ON p.id_proyecto = pr.id_proyecto
                WHERE p.id_presupuesto = :id_presupuesto
                AND p.idestado = 1
                LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->execute(['id_presupuesto' => $id]);

        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$data) {
            return null;
        }

        return Presupuesto::fromArray($data);
    }

    public function update(Presupuesto $presupuesto): bool {
        $sql = "UPDATE presupuestos 
                SET id_proyecto = :id_proyecto,
                    fecha_creacion = :fecha_creacion,
                    monto_total = :monto_total,
                    fechaupdate = NOW()
                WHERE id_presupuesto = :id_presupuesto
                AND idestado = 1";

        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([
            'id_proyecto'    => $presupuesto->getIdProyecto(),
            'fecha_creacion' => $presupuesto->getFechaCreacion(),
            'monto_total'    => $presupuesto->getMonto(),
            'id_presupuesto' => $presupuesto->getId()
        ]);
    }

    public function delete(int $id): bool {
        $sql = "UPDATE presupuestos 
                SET idestado = 0, 
                    fechaupdate = NOW() 
                WHERE id_presupuesto = :id_presupuesto";

        $stmt = $this->conn->prepare($sql);
        return $stmt->execute(['id_presupuesto' => $id]);
    }

    public function getCapitulosOrdenadosPorPresupuesto(int $idPresupuesto): array {
        $query = "SELECT 
                    id_capitulo,
                    nombre_cap,
                    id_presupuesto,
                    fechareg
                FROM capitulos 
                WHERE id_presupuesto = :id_presupuesto
                AND estado = 1
                ORDER BY fechareg ASC, id_capitulo ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute(['id_presupuesto' => $idPresupuesto]);

        $capitulos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $resultado = [];
        foreach ($capitulos as $index => $capitulo) {
            $capitulo['numero_ordinal'] = $index + 1;
            $resultado[] = $capitulo;
        }
        
        return $resultado;
    }

    public function buscarCapituloPorNumeroOrdinal(int $idPresupuesto, int $numeroOrdinal): ?array {
        $capitulos = $this->getCapitulosOrdenadosPorPresupuesto($idPresupuesto);
        
        if (isset($capitulos[$numeroOrdinal - 1])) {
            return $capitulos[$numeroOrdinal - 1];
        }
        
        return null;
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

    public function validarPresupuestoParaProyecto(int $idPresupuesto, int $idProyecto): ?array {
        $query = "SELECT 
                    id_presupuesto, 
                    id_proyecto 
                FROM presupuestos 
                WHERE id_presupuesto = :id_presupuesto 
                AND id_proyecto = :id_proyecto
                AND idestado = 1
                LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            'id_presupuesto' => $idPresupuesto,
            'id_proyecto' => $idProyecto
        ]);

        $presupuesto = $stmt->fetch(PDO::FETCH_ASSOC);
        return $presupuesto ?: null;
    }

    public function validarCapituloParaPresupuesto(int $idCapitulo, int $idPresupuesto): ?array {
        $query = "SELECT 
                    id_capitulo,
                    nombre_cap,
                    id_presupuesto
                FROM capitulos 
                WHERE id_capitulo = :id_capitulo 
                AND id_presupuesto = :id_presupuesto
                AND estado = 1
                LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            'id_capitulo' => $idCapitulo,
            'id_presupuesto' => $idPresupuesto
        ]);

        $capitulo = $stmt->fetch(PDO::FETCH_ASSOC);
        return $capitulo ?: null;
    }

    public function validateImportMasive(array $data, int $idProyecto, int $idPresupuesto): array {
        $filas = [];
        $encabezado = true;

        $presupuestoValido = $this->validarPresupuestoParaProyecto($idPresupuesto, $idProyecto);
        if (!$presupuestoValido) {
            throw new Exception("El presupuesto seleccionado no pertenece al proyecto");
        }

        $materiales = $this->getMaterialesConPrecios();
        $materialesMap = [];
        foreach ($materiales as $material) {
            $materialesMap[$material['cod_material']] = $material;
        }

        $capitulosOrdenados = $this->getCapitulosOrdenadosPorPresupuesto($idPresupuesto);
        $capitulosMap = [];
        foreach ($capitulosOrdenados as $cap) {
            $capitulosMap[$cap['numero_ordinal']] = $cap;
        }

        foreach ($data as $fila) {
            if ($encabezado) { 
                $encabezado = false; 
                continue;
            }

            $numeroCapitulo = trim($fila[0] ?? '');
            $codigoMaterial = trim($fila[1] ?? ''); 
            $cantidad = trim($fila[2] ?? '');
            $fecha = trim($fila[3] ?? '');
            $nombrePresupuesto = trim($fila[4] ?? '');

            if (empty($numeroCapitulo) && empty($codigoMaterial)) {
                continue;
            }

            $errores = [];
            $idCapitulo = null;
            $nombreCapitulo = 'Capítulo no válido';

            if (empty($numeroCapitulo)) {
                $errores[] = 'Número de capítulo requerido';
            } elseif (!is_numeric($numeroCapitulo)) {
                $errores[] = 'Número de capítulo debe ser numérico (1, 2, 3...)';
            } else {
                $numeroCapitulo = (int)$numeroCapitulo;
                if (!isset($capitulosMap[$numeroCapitulo])) {
                    $totalCapitulos = count($capitulosOrdenados);
                    $errores[] = "No existe el capítulo número {$numeroCapitulo}. Solo hay {$totalCapitulos} capítulos.";
                } else {
                    $capitulo = $capitulosMap[$numeroCapitulo];
                    $idCapitulo = $capitulo['id_capitulo'];
                    $nombreCapitulo = $capitulo['nombre_cap'];
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
                'presupuesto' => $nombrePresupuesto,
                'capitulo' => $nombreCapitulo,
                'material_codigo' => $codigoMaterial,
                'material_nombre' => $nombreMaterial,
                'tipo_material' => $tipoMaterial,
                'unidad' => $unidad,
                'cantidad' => (float)$cantidad,
                'precio_unitario' => (float)$precioUnitario,
                'valor_total' => $valorTotal,
                'fecha' => $fecha,
                'numero_ordinal_original' => $numeroCapitulo,

                'id_det_presupuesto' => null,
                'id_presupuesto' => $idPresupuesto,
                'id_material' => $idMaterial,
                'id_capitulo' => $idCapitulo,
                'id_mat_precio' => $idMatPrecio,
                'idestado' => 1,
                'idusuario' => 1,
                'fechareg' => date('Y-m-d H:i:s'),
                'fechaupdate' => date('Y-m-d H:i:s'),

                'id_proyecto' => $idProyecto,
                'precio_actual' => (float)$precioUnitario,
                'valor_total_calculado' => $valorTotal,

                'ok' => empty($errores),
                'errores' => $errores
            ];
        }

        return $filas;
    }

    public function guardarPresupuestosMasive(array $presupuestosData, int $idPresupuesto): bool {
        session_start();
        $datos = isset($_SESSION['seguridad']) ? json_decode($_SESSION['seguridad'], true) : null;

        if (!$datos || !isset($datos['usuario'])) {
            throw new Exception('Sesión inválida o no iniciada.');
        }

        $idUsuario = (int)$datos['usuario'];

        try {
            $this->conn->beginTransaction();

            foreach ($presupuestosData as $item) {
                if (empty($item['id_material']) || empty($item['id_capitulo']) || empty($item['cantidad'])) {
                    throw new Exception('Datos incompletos: ' . json_encode($item));
                }

                $stmtPrecio = $this->conn->prepare("
                    SELECT id_mat_precio 
                    FROM material_precio 
                    WHERE id_material = ? AND estado = 1 
                    ORDER BY fecha DESC 
                    LIMIT 1
                ");
                $stmtPrecio->execute([$item['id_material']]);
                $precioData = $stmtPrecio->fetch(PDO::FETCH_ASSOC);

                if (!$precioData) {
                    throw new Exception('No se encontró precio para el material ID: ' . $item['id_material']);
                }

                $idMatPrecio = $precioData['id_mat_precio'];

                $stmt = $this->conn->prepare("
                    INSERT INTO det_presupuesto (
                        id_presupuesto, 
                        id_material, 
                        id_capitulo, 
                        id_mat_precio, 
                        cantidad, 
                        idestado, 
                        idusuario, 
                        fechareg, 
                        fechaupdate
                    ) VALUES (?, ?, ?, ?, ?, 1, ?, NOW(), NOW())
                ");

                $stmt->execute([
                    $idPresupuesto,
                    $item['id_material'],
                    $item['id_capitulo'],
                    $idMatPrecio,
                    $item['cantidad'],
                    $idUsuario
                ]);
            }

            $this->conn->commit();
            return true;

        } catch (Exception $e) {
            $this->conn->rollBack();
            throw new Exception('Error al guardar presupuestos: ' . $e->getMessage());
        }
    }

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

    public function getPresupuestosByProyecto(int $idProyecto): array {
        $query = "SELECT 
                    p.id_presupuesto,
                    p.fecha_creacion,
                    p.monto_total,
                    p.observaciones
                FROM presupuestos p
                WHERE p.id_proyecto = :id_proyecto
                AND p.idestado = 1
                ORDER BY p.fecha_creacion DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute(['id_proyecto' => $idProyecto]);

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $result ?: [];
    }

    public function getDetallePresupuesto(int $idPresupuesto): array {
        $query = "SELECT 
                    dp.id_det_presupuesto,
                    dp.id_presupuesto,
                    dp.id_material,
                    m.cod_material,
                    CAST(m.nombremat AS CHAR) AS nombre_material,
                    dp.id_capitulo,
                    c.nombre_cap,
                    dp.cantidad,
                    mp.valor AS precio_unitario,
                    (dp.cantidad * mp.valor) AS valor_total,
                    u.unidesc AS unidad
                FROM det_presupuesto dp
                INNER JOIN materiales m ON dp.id_material = m.id_material
                INNER JOIN capitulos c ON dp.id_capitulo = c.id_capitulo
                INNER JOIN material_precio mp ON dp.id_mat_precio = mp.id_mat_precio
                INNER JOIN gr_unidad u ON m.idunidad = u.idunidad
                WHERE dp.id_presupuesto = :id_presupuesto
                AND dp.idestado = 1
                ORDER BY c.nombre_cap, m.cod_material";

        $stmt = $this->conn->prepare($query);
        $stmt->execute(['id_presupuesto' => $idPresupuesto]);

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $result ?: [];
    }
}