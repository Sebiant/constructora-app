<?php
/**
 * Generador dinámico de plantilla Excel para importación masiva de recursos
 * Este archivo genera un archivo Excel con el formato correcto usando PhpSpreadsheet
 * Incluye hoja de valores válidos para TIPO y UNIDAD (listas desplegables)
 */

require __DIR__ . '/../../../vendor/autoload.php';
require __DIR__ . '/../../../config/database.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

try {
    $db = new \Database();
    $connection = $db->getConnection();

    // Obtener valores válidos para dropdowns
    $tiposStmt = $connection->query("SELECT desc_tipo FROM tipo_material WHERE estado = 1 ORDER BY desc_tipo");
    $tipos = $tiposStmt->fetchAll(PDO::FETCH_COLUMN);
    
    $unidadesStmt = $connection->query("SELECT unidesc FROM gr_unidad WHERE id_estado = 1 ORDER BY unidesc");
    $unidades = $unidadesStmt->fetchAll(PDO::FETCH_COLUMN);

    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle('Importar Recursos');

    $spreadsheet->getProperties()
        ->setCreator('Sistema de Gestión')
        ->setTitle('Formato de Importación Masiva de Recursos')
        ->setDescription('Plantilla para importar recursos masivamente. Use valores válidos según la hoja "Valores Válidos".');

    // Cabeceras sin IDs ni ESTADO
    $headers = [
        'CODIGO',
        'NOMBRE',
        'TIPO',           // Antes ID_TIPO_MATERIAL
        'UNIDAD',         // Antes IDUNIDAD
        'PRECIO',
        'MINIMO_COMERCIAL',
        'PRESENTACION_COMERCIAL'
    ];
    $sheet->fromArray($headers, null, 'A1');

    // Hoja de valores válidos
    $validSheet = $spreadsheet->createSheet();
    $validSheet->setTitle('Valores Válidos');
    
    // Escribir tipos
    $validSheet->setCellValue('A1', 'TIPOS VÁLIDOS (copie y pegue)');
    $validSheet->fromArray(array_map(fn($t) => [$t], $tipos), null, 'A2');
    
    // Escribir unidades
    $validSheet->setCellValue('C1', 'UNIDADES VÁLIDAS (copie y pegue)');
    $validSheet->fromArray(array_map(fn($u) => [$u], $unidades), null, 'C2');

    // Estilos cabecera
    $headerStyle = [
        'font' => [
            'bold' => true,
            'color' => ['rgb' => 'FFFFFF'],
            'size' => 12
        ],
        'fill' => [
            'fillType' => Fill::FILL_SOLID,
            'startColor' => ['rgb' => '4472C4']
        ],
        'borders' => [
            'allBorders' => [
                'borderStyle' => Border::BORDER_THIN,
                'color' => ['rgb' => '000000']
            ]
        ],
        'alignment' => [
            'horizontal' => Alignment::HORIZONTAL_CENTER,
            'vertical' => Alignment::VERTICAL_CENTER
        ]
    ];

    $sheet->getStyle('A1:G1')->applyFromArray($headerStyle);
    $validSheet->getStyle('A1:C1')->applyFromArray($headerStyle);

    // Anchos de columnas
    $sheet->getColumnDimension('A')->setWidth(18);
    $sheet->getColumnDimension('B')->setWidth(40);
    $sheet->getColumnDimension('C')->setWidth(20);
    $sheet->getColumnDimension('D')->setWidth(12);
    $sheet->getColumnDimension('E')->setWidth(14);
    $sheet->getColumnDimension('F')->setWidth(18);
    $sheet->getColumnDimension('G')->setWidth(28);
    $sheet->getColumnDimension('H')->setWidth(10);
    $sheet->getRowDimension(1)->setRowHeight(25);

    $validSheet->getColumnDimension('A')->setWidth(30);
    $validSheet->getColumnDimension('C')->setWidth(30);
    $validSheet->getRowDimension(1)->setRowHeight(25);

    // Ajustar zoom y seleccionar hoja principal
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
