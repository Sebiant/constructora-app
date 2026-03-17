<?php
/**
 * Generador dinámico de plantilla Excel para importación masiva de recursos
 * Incluye listas desplegables (Data Validation) para TIPO y UNIDAD
 * Los valores se cargan dinámicamente desde la base de datos.
 */

require __DIR__ . '/../../../vendor/autoload.php';
require __DIR__ . '/../../../config/database.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;

try {
    $db = new \Database();
    $connection = $db->getConnection();

    // Obtener valores válidos para dropdowns desde la BD
    $tiposStmt = $connection->query("SELECT desc_tipo FROM tipo_material WHERE estado = 1 ORDER BY desc_tipo");
    $tipos = $tiposStmt->fetchAll(PDO::FETCH_COLUMN);

    $unidadesStmt = $connection->query("SELECT unidesc FROM gr_unidad WHERE id_estado = 1 ORDER BY unidesc");
    $unidades = $unidadesStmt->fetchAll(PDO::FETCH_COLUMN);

    $numTipos    = count($tipos);
    $numUnidades = count($unidades);

    $spreadsheet = new Spreadsheet();

    // ─── Hoja principal: Importar Recursos ───────────────────────────────────
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle('Importar Recursos');

    $spreadsheet->getProperties()
        ->setCreator('Sistema de Gestión')
        ->setTitle('Formato de Importación Masiva de Recursos')
        ->setDescription('Use las listas desplegables en TIPO y UNIDAD (columnas amarillas).');

    // Cabeceras
    $sheet->fromArray(['CODIGO', 'NOMBRE', 'TIPO', 'UNIDAD', 'PRECIO', 'MINIMO_COMERCIAL', 'PRESENTACION_COMERCIAL'], null, 'A1');

    // Estilo cabecera
    $sheet->getStyle('A1:G1')->applyFromArray([
        'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 12],
        'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']],
        'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
    ]);
    $sheet->getRowDimension(1)->setRowHeight(25);

    // Fondo amarillo SOLO en columna TIPO (C) — UNIDAD es texto libre
    $maxDataRow = 500;
    $dropdownFill = [
        'fill'    => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFF2CC']],
        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CCCCCC']]],
    ];
    $sheet->getStyle("C2:C{$maxDataRow}")->applyFromArray($dropdownFill);

    // Anchos de columnas
    $sheet->getColumnDimension('A')->setWidth(18);
    $sheet->getColumnDimension('B')->setWidth(40);
    $sheet->getColumnDimension('C')->setWidth(20);
    $sheet->getColumnDimension('D')->setWidth(14);
    $sheet->getColumnDimension('E')->setWidth(14);
    $sheet->getColumnDimension('F')->setWidth(18);
    $sheet->getColumnDimension('G')->setWidth(28);

    // ─── Hoja auxiliar: Valores Válidos ──────────────────────────────────────
    $validSheet = $spreadsheet->createSheet();
    $validSheet->setTitle('Valores Válidos');

    // Títulos
    $validSheet->setCellValue('A1', 'TIPOS VÁLIDOS');
    $validSheet->setCellValue('C1', 'UNIDADES VÁLIDAS');

    $headerStyleValid = [
        'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
        'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2E75B6']],
        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'AAAAAA']]],
    ];
    $validSheet->getStyle('A1')->applyFromArray($headerStyleValid);
    $validSheet->getStyle('C1')->applyFromArray($headerStyleValid);

    // Escribir tipos
    $tipoFill = ['fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'DEEAF1']]];
    foreach ($tipos as $i => $tipo) {
        $r = $i + 2;
        $validSheet->setCellValue("A{$r}", $tipo);
        $validSheet->getStyle("A{$r}")->applyFromArray($tipoFill);
    }

    // Escribir unidades
    $unidadFill = ['fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E2EFDA']]];
    foreach ($unidades as $i => $unidad) {
        $r = $i + 2;
        $validSheet->setCellValue("C{$r}", $unidad);
        $validSheet->getStyle("C{$r}")->applyFromArray($unidadFill);
    }

    $validSheet->getColumnDimension('A')->setWidth(28);
    $validSheet->getColumnDimension('B')->setWidth(4);
    $validSheet->getColumnDimension('C')->setWidth(20);
    $validSheet->getRowDimension(1)->setRowHeight(22);

    // ─── Data Validation: Dropdown SOLO en TIPO ─────────────────────────────
    // Se usa lista incrustada directamente como string para evitar el error
    // de referencia a ruta externa (C:\Users\...\Valores Válidos) que genera
    // PhpSpreadsheet al referenciar otra hoja del mismo libro.
    $tiposInline = '"' . implode(',', array_map('trim', $tipos)) . '"';

    for ($row = 2; $row <= $maxDataRow; $row++) {
        // Dropdown TIPO — columna C
        $dv = $sheet->getCell("C{$row}")->getDataValidation();
        $dv->setType(DataValidation::TYPE_LIST);
        $dv->setErrorStyle(DataValidation::STYLE_STOP);
        $dv->setAllowBlank(true);
        $dv->setShowDropDown(true);
        $dv->setShowInputMessage(true);
        $dv->setShowErrorMessage(true);
        $dv->setPromptTitle('Tipo de recurso');
        $dv->setPrompt('Seleccione: ' . implode(', ', $tipos));
        $dv->setErrorTitle('Valor inv\u00e1lido');
        $dv->setError('Valores permitidos: ' . implode(', ', $tipos));
        $dv->setFormula1($tiposInline);
        // UNIDAD (columna D) — sin restricci\u00f3n, texto libre
    }

    // ─── Activar hoja principal y enviar ─────────────────────────────────────
    $spreadsheet->setActiveSheetIndex(0);
    $sheet->setSelectedCell('A2');

    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment;filename="formato_recursos_masivo.xlsx"');
    header('Cache-Control: max-age=0');
    header('Cache-Control: max-age=1');
    header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
    header('Cache-Control: cache, must-revalidate');
    header('Pragma: public');

    if (ob_get_level()) {
        ob_end_clean();
    }

    $writer = new Xlsx($spreadsheet);
    $writer->save('php://output');

    $spreadsheet->disconnectWorksheets();
    unset($spreadsheet);

    exit;
} catch (\Exception $e) {
    http_response_code(500);
    echo 'Error al generar el archivo Excel: ' . $e->getMessage();
    exit;
}
