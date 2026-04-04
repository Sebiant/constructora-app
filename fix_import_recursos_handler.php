<?php
// Este código debe integrarse en la función importRecursosMasivo en ItemsController.php
// Reemplazar el bloque try-catch existente

try {
    $connection->beginTransaction();
    
    // ... (código existente de procesamiento de rows) ...
    
    foreach ($rows as $row) {
        // ... (validaciones existentes) ...
        
        try {
            // Intentar insertar material
            if ($hasNotasCol) {
                $stmtInsertMaterial->execute([
                    $codigo, $nombre, $tipoId, $unidadId, $usuarioId,
                    $estado, $minimoComercial, $presentacion, $notasImportacion
                ]);
            } else {
                $stmtInsertMaterial->execute([
                    $codigo, $nombre, $tipoId, $unidadId, $usuarioId,
                    $estado, $minimoComercial, $presentacion
                ]);
            }
            
            $materialId = (int)$connection->lastInsertId();
            
            // Insertar precio si aplica
            if ($precio > 0) {
                $stmtInsertPrecio->execute([$materialId, $precio, $usuarioId]);
            }
            
            if ($codigo !== '') {
                $existingCodes[$codigo] = true;
                $importCodes[$codigo] = true; // Agregar a códigos de esta importación
            }
            $inserted++;
            
        } catch (PDOException $e) {
            // Si es error de duplicado, contar como omitido y continuar
            if ($e->getCode() == 23000 || strpos($e->getMessage(), 'Duplicate entry') !== false) {
                $skipped++;
                continue;
            } else {
                // Si es otro error, relanzar la excepción
                throw $e;
            }
        }
    }
    
    $connection->commit();
    
} catch (Exception $e) {
    $connection->rollback();
    throw $e;
}
?>
