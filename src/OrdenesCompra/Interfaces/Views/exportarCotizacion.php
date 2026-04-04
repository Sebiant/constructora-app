<?php
/**
 * exportarCotizacion.php
 * Genera y descarga la plantilla Excel de cotización para un pedido.
 * Uso: /sgigescon/src/OrdenesCompra/Interfaces/Views/exportarCotizacion.php?id_pedido=X
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../config/database.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Font;

$idPedido = (int)($_GET['id_pedido'] ?? 0);

if (!$idPedido) {
    http_response_code(400);
    die('ID de pedido requerido');
}

try {
    $db = new Database();
    $conn = $db->getConnection();

    /* ── Información del pedido ─────────────────────────────────── */
    $sqlPedido = "SELECT
                    p.id_pedido,
                    p.fecha_pedido,
                    pr.nombre AS nombre_proyecto,
                    pres.codigo AS codigo_presupuesto,
                    pres.nombre AS nombre_presupuesto
                  FROM pedidos p
                  LEFT JOIN presupuestos pres ON p.id_presupuesto = pres.id_presupuesto
                  LEFT JOIN proyectos pr ON pres.id_proyecto = pr.id_proyecto
                  WHERE p.id_pedido = ?";
    $stmtP = $conn->prepare($sqlPedido);
    $stmtP->execute([$idPedido]);
    $pedidoInfo = $stmtP->fetch(PDO::FETCH_ASSOC);

    if (!$pedidoInfo) {
        http_response_code(404);
        die('Pedido no encontrado');
    }

    /* ── Productos del pedido con cantidades disponibles ─────────── */
    $sqlProductos = "SELECT
                        pd.id_det_pedido,
                        pd.tipo_componente,
                        COALESCE(ic.descripcion, CAST(m.nombremat AS CHAR)) AS descripcion,
                        COALESCE(ic.unidad, u.unidesc, 'UND') AS unidad,
                        pd.cantidad,
                        COALESCE(SUM(ocd.cantidad_comprada), 0) AS cantidad_comprada,
                        GREATEST(pd.cantidad - COALESCE(SUM(ocd.cantidad_comprada), 0), 0) AS cantidad_disponible
                    FROM pedidos_detalle pd
                    LEFT JOIN item_componentes ic ON pd.id_componente = ic.id_componente
                    LEFT JOIN materiales_extra_presupuesto mep ON pd.id_material_extra = mep.id_material_extra
                    LEFT JOIN materiales m ON mep.id_material = m.id_material
                    LEFT JOIN gr_unidad u ON m.idunidad = u.idunidad
                    LEFT JOIN ordenes_compra_detalle ocd ON pd.id_det_pedido = ocd.id_det_pedido
                    LEFT JOIN ordenes_compra oc ON ocd.id_orden_compra = oc.id_orden_compra
                        AND oc.estado IN ('aprobada', 'comprada', 'parcialmente_comprada')
                    WHERE pd.id_pedido = ?
                    GROUP BY pd.id_det_pedido, pd.tipo_componente,
                             ic.descripcion, m.nombremat, ic.unidad, u.unidesc, pd.cantidad
                    HAVING cantidad_disponible > 0
                    ORDER BY COALESCE(ic.descripcion, m.nombremat) ASC";

    $stmtProd = $conn->prepare($sqlProductos);
    $stmtProd->execute([$idPedido]);
    $productos = $stmtProd->fetchAll(PDO::FETCH_ASSOC);

    if (empty($productos)) {
        http_response_code(404);
        die('Este pedido no tiene productos disponibles para cotizar');
    }

    /* ── Proveedores activos (para la hoja auxiliar) ─────────────── */
    $stmtProv = $conn->prepare("SELECT id_provedor, nombre, email, telefono FROM provedores WHERE estado = 1 ORDER BY nombre");
    $stmtProv->execute();
    $proveedores = $stmtProv->fetchAll(PDO::FETCH_ASSOC);

} catch (Exception $e) {
    http_response_code(500);
    die('Error: ' . $e->getMessage());
}

/* ════════════════════════════════════════════════════════════════════
   CONSTRUCCIÓN DEL EXCEL
   ════════════════════════════════════════════════════════════════════ */

const NUM_PROV_SLOTS = 6;  // Columnas de proveedores en la plantilla
const FIXED_COLS     = 6;  // ID | Tipo | Descripción | Unidad | Cantidad | (vacía)
const DATA_ROW_START = 5;  // Fila donde inician los datos

$spreadsheet = new Spreadsheet();

/* ── Hoja 1: Cotización ─────────────────────────────────────────── */
$sheet = $spreadsheet->getActiveSheet();
$sheet->setTitle('Cotización');

$totalCols = FIXED_COLS + (NUM_PROV_SLOTS * 2);
$lastCol   = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($totalCols);

/* ── Fila 1: Título ──────────────────────────────────────────────── */
$sheet->mergeCells("A1:{$lastCol}1");
$sheet->setCellValue('A1',
    "PLANTILLA DE COTIZACIÓN — Pedido #{$idPedido} | " .
    ($pedidoInfo['nombre_proyecto'] ?? 'Sin proyecto') . " | " .
    ($pedidoInfo['nombre_presupuesto'] ?? '') .
    " | Fecha: " . date('d/m/Y')
);
$sheet->getStyle('A1')->applyFromArray([
    'font'      => ['bold' => true, 'size' => 13, 'color' => ['rgb' => 'FFFFFF']],
    'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '00384A']],
    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
]);
$sheet->getRowDimension(1)->setRowHeight(28);

/* ── Fila 2: Instrucciones ───────────────────────────────────────── */
$sheet->mergeCells("A2:{$lastCol}2");
$sheet->setCellValue('A2',
    '⚠ INSTRUCCIONES: (1) En la fila 4, escriba el nombre del proveedor en cada celda amarilla "NOMBRE DEL PROVEEDOR". ' .
    '(2) Complete los PRECIOS UNITARIOS en las filas de datos. ' .
    '(3) No modifique las columnas A-F ni la fila 3. ' .
    '(4) Guarde y suba este archivo para importar la cotización.'
);
$sheet->getStyle('A2')->applyFromArray([
    'font'      => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '5C3317']],
    'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFF3CD']],
    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
]);
$sheet->getRowDimension(2)->setRowHeight(40);

/* ── Fila 3: Encabezados de columnas fijas ───────────────────────── */
$fixedHeaders = ['ID_INTERNO', 'TIPO_RECURSO', 'DESCRIPCIÓN', 'UNIDAD', 'CANT_DISPONIBLE', ''];
foreach ($fixedHeaders as $i => $h) {
    $sheet->setCellValueByColumnAndRow($i + 1, 3, $h);
}

// Encabezados de proveedores en fila 3 (merged cada 2 columnas)
for ($p = 0; $p < NUM_PROV_SLOTS; $p++) {
    $colBase  = FIXED_COLS + 1 + ($p * 2);
    $colBase2 = $colBase + 1;
    $colLetter1 = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colBase);
    $colLetter2 = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colBase2);

    $sheet->mergeCells("{$colLetter1}3:{$colLetter2}3");
    $sheet->setCellValueByColumnAndRow($colBase, 3, "PROVEEDOR " . ($p + 1));
}

$sheet->getStyle("A3:{$lastCol}3")->applyFromArray([
    'font'      => ['bold' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
    'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '005F7A']],
    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
]);
$sheet->getRowDimension(3)->setRowHeight(20);

/* ── Fila 4: Sub-encabezados (nombre proveedor + precio) ─────────── */
// Columnas fijas vacías en fila 4
for ($i = 1; $i <= FIXED_COLS; $i++) {
    $sheet->setCellValueByColumnAndRow($i, 4, '');
}

// Sub-encabezados de proveedores
for ($p = 0; $p < NUM_PROV_SLOTS; $p++) {
    $colNombre = FIXED_COLS + 1 + ($p * 2);
    $colPrecio = $colNombre + 1;

    $sheet->setCellValueByColumnAndRow($colNombre, 4, 'NOMBRE DEL PROVEEDOR');
    $sheet->setCellValueByColumnAndRow($colPrecio, 4, 'PRECIO_UNITARIO');

    // Celda de nombre: fondo amarillo para que el usuario la identifique
    $colLetraNombre = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colNombre);
    $sheet->getStyle("{$colLetraNombre}4")->applyFromArray([
        'font'      => ['bold' => true, 'italic' => true, 'size' => 9, 'color' => ['rgb' => '7B4F00']],
        'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFD700']],
        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
    ]);

    $colLetraPrecio = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colPrecio);
    $sheet->getStyle("{$colLetraPrecio}4")->applyFromArray([
        'font'      => ['bold' => true, 'size' => 9, 'color' => ['rgb' => 'FFFFFF']],
        'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '28A745']],
        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
    ]);
}

$sheet->getRowDimension(4)->setRowHeight(22);

/* ── Filas de datos ──────────────────────────────────────────────── */
$tiposLegibles = [
    'material'   => 'Material',
    'mano_obra'  => 'Mano de Obra',
    'maquinaria' => 'Maquinaria',
    'equipo'     => 'Equipo',
    'varios'     => 'Varios',
];

$rowNum = DATA_ROW_START;
foreach ($productos as $prod) {
    $cantDisp = floatval($prod['cantidad_disponible']);
    $tipo     = $prod['tipo_componente'] ?? 'material';
    $tipoLabel= $tiposLegibles[$tipo] ?? ucfirst($tipo);

    $sheet->setCellValueByColumnAndRow(1, $rowNum, $prod['id_det_pedido']);
    $sheet->setCellValueByColumnAndRow(2, $rowNum, $tipoLabel);
    $sheet->setCellValueByColumnAndRow(3, $rowNum, $prod['descripcion'] ?? '');
    $sheet->setCellValueByColumnAndRow(4, $rowNum, $prod['unidad'] ?? '');
    $sheet->setCellValueByColumnAndRow(5, $rowNum, $cantDisp);
    $sheet->setCellValueByColumnAndRow(6, $rowNum, '');   // spacer

    // Celdas de precio (vacías, listas para que el usuario llene)
    for ($p = 0; $p < NUM_PROV_SLOTS; $p++) {
        $colNombre = FIXED_COLS + 1 + ($p * 2);
        $colPrecio = $colNombre + 1;

        $sheet->setCellValueByColumnAndRow($colNombre, $rowNum, ''); // nombre (lo hereda de fila 4)
        $sheet->setCellValueByColumnAndRow($colPrecio, $rowNum, ''); // precio vacío

        // Fondo verde muy claro para las celdas de precio
        $colLetraPrecio = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colPrecio);
        $sheet->getStyle("{$colLetraPrecio}{$rowNum}")->applyFromArray([
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E8F5E9']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
            'numberFormat' => ['formatCode' => '#,##0.00'],
        ]);

        // Fondo gris claro para columna de nombre (no editable visualmente)
        $colLetraNombre = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colNombre);
        $sheet->getStyle("{$colLetraNombre}{$rowNum}")->applyFromArray([
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F9F9F9']],
        ]);
    }

    // Estilo de fila alternada para legibilidad
    if ($rowNum % 2 === 0) {
        $sheet->getStyle("A{$rowNum}:F{$rowNum}")->applyFromArray([
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F4F8FB']],
        ]);
    }

    $sheet->getRowDimension($rowNum)->setRowHeight(18);
    $rowNum++;
}

/* ── Ancho de columnas ───────────────────────────────────────────── */
$sheet->getColumnDimensionByColumn(1)->setWidth(14);  // ID
$sheet->getColumnDimensionByColumn(2)->setWidth(15);  // Tipo
$sheet->getColumnDimensionByColumn(3)->setWidth(42);  // Descripción
$sheet->getColumnDimensionByColumn(4)->setWidth(9);   // Unidad
$sheet->getColumnDimensionByColumn(5)->setWidth(12);  // Cantidad
$sheet->getColumnDimensionByColumn(6)->setWidth(3);   // spacer

for ($p = 0; $p < NUM_PROV_SLOTS; $p++) {
    $colN = FIXED_COLS + 1 + ($p * 2);
    $colP = $colN + 1;
    $sheet->getColumnDimensionByColumn($colN)->setWidth(22); // nombre proveedor
    $sheet->getColumnDimensionByColumn($colP)->setWidth(14); // precio
}

/* ── Bordes generales ────────────────────────────────────────────── */
$lastDataRow = $rowNum - 1;
if ($lastDataRow >= DATA_ROW_START) {
    $sheet->getStyle("A3:{$lastCol}{$lastDataRow}")->applyFromArray([
        'borders' => [
            'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CCCCCC']],
        ],
    ]);
}

// Ocultar columna A (ID_INTERNO) — visible pero angosta
$sheet->getColumnDimensionByColumn(1)->setWidth(14);
$sheet->getStyle('A3:A' . $lastDataRow)->applyFromArray([
    'font' => ['size' => 8, 'color' => ['rgb' => 'AAAAAA']],
    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F5F5F5']],
]);

// Freeze panes (fijar las primeras 4 filas y las primeras 6 columnas)
$sheet->freezePane('G5');

/* ── Hoja 2: Proveedores (referencia) ───────────────────────────── */
$sheetProv = $spreadsheet->createSheet();
$sheetProv->setTitle('Proveedores (referencia)');

$sheetProv->setCellValue('A1', 'ID');
$sheetProv->setCellValue('B1', 'NOMBRE');
$sheetProv->setCellValue('C1', 'EMAIL');
$sheetProv->setCellValue('D1', 'TELÉFONO');

$sheetProv->getStyle('A1:D1')->applyFromArray([
    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '00384A']],
]);

$rp = 2;
foreach ($proveedores as $pv) {
    $sheetProv->setCellValue("A{$rp}", $pv['id_provedor']);
    $sheetProv->setCellValue("B{$rp}", $pv['nombre']);
    $sheetProv->setCellValue("C{$rp}", $pv['email'] ?? '');
    $sheetProv->setCellValue("D{$rp}", $pv['telefono'] ?? '');
    $rp++;
}
$sheetProv->getColumnDimension('A')->setWidth(8);
$sheetProv->getColumnDimension('B')->setWidth(30);
$sheetProv->getColumnDimension('C')->setWidth(28);
$sheetProv->getColumnDimension('D')->setWidth(18);

// Volver a la hoja principal
$spreadsheet->setActiveSheetIndex(0);

/* ── Enviar descarga ─────────────────────────────────────────────── */
$filename = 'cotizacion_pedido_' . $idPedido . '_' . date('Ymd') . '.xlsx';

header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: max-age=0, no-cache, no-store, must-revalidate');
header('Pragma: no-cache');

$writer = new Xlsx($spreadsheet);
$writer->save('php://output');
exit;
