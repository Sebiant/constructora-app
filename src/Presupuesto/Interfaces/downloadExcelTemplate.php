<?php
/**
 * Generador dinámico de plantilla Excel para importación masiva de presupuestos
 * Este archivo genera un archivo Excel con el formato correcto usando PhpSpreadsheet
 */

require __DIR__ . '/../../../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

try {
    // Crear nuevo libro de Excel
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    
    // Configurar propiedades del documento
    $spreadsheet->getProperties()
        ->setCreator('Sistema de Gestión')
        ->setTitle('Formato de Importación Masiva de Presupuesto')
        ->setDescription('Plantilla para importar presupuestos masivamente');
    
    // Definir encabezados
    $headers = ['CAP', 'COD', 'Cantidad'];
    $sheet->fromArray($headers, null, 'A1');
    
    // Estilizar encabezados
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
    
    $sheet->getStyle('A1:C1')->applyFromArray($headerStyle);
    
    // Ajustar anchos de columna
    $sheet->getColumnDimension('A')->setWidth(15); // CAP
    $sheet->getColumnDimension('B')->setWidth(20); // COD
    $sheet->getColumnDimension('C')->setWidth(15); // Cantidad
    
    // Agregar altura a la fila de encabezados
    $sheet->getRowDimension(1)->setRowHeight(25);
    
    // Configurar para descarga
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment;filename="formato_presupuesto_masivo.xlsx"');
    header('Cache-Control: max-age=0');
    header('Cache-Control: max-age=1');
    header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
    header('Cache-Control: cache, must-revalidate');
    header('Pragma: public');
    
    // Limpiar cualquier salida previa
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    // Crear el writer y generar el archivo
    $writer = new Xlsx($spreadsheet);
    $writer->save('php://output');
    
    // Liberar memoria
    $spreadsheet->disconnectWorksheets();
    unset($spreadsheet);
    
    exit;
    
} catch (\Exception $e) {
    // Si hay un error, responder con mensaje de error
    http_response_code(500);
    echo 'Error al generar el archivo Excel: ' . $e->getMessage();
    exit;
}
