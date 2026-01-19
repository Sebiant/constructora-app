<?php
/**
 * Funciones de utilidad para cálculos comerciales de materiales
 */

/**
 * Calcula la cantidad real a comprar considerando el mínimo comercial
 * Siempre redondea hacia arriba para asegurar que alcance el material necesario
 * 
 * @param float $cantidadNecesaria Cantidad que se necesita para el trabajo
 * @param float $minimoComercial Cantidad mínima que se puede comprar
 * @return array Cantidades calculadas con información de desperdicio
 */
function calcularCantidadComercial($cantidadNecesaria, $minimoComercial) {
    // Validar entradas
    $cantidadNecesaria = (float)$cantidadNecesaria;
    $minimoComercial = (float)$minimoComercial;
    
    if ($cantidadNecesaria <= 0 || $minimoComercial <= 0) {
        return [
            'cantidad_necesaria' => $cantidadNecesaria,
            'cantidad_comprar' => 0,
            'unidades_minimas' => 0,
            'desperdicio' => 0,
            'porcentaje_desperdicio' => 0,
            'redondeo_aplicado' => false
        ];
    }
    
    // Calcular cuántas unidades mínimas se necesitan
    $unidadesMinimas = ceil($cantidadNecesaria / $minimoComercial);
    $cantidadComprar = $unidadesMinimas * $minimoComercial;
    $desperdicio = $cantidadComprar - $cantidadNecesaria;
    $porcentajeDesperdicio = ($cantidadNecesaria > 0) ? ($desperdicio / $cantidadNecesaria) * 100 : 0;
    
    return [
        'cantidad_necesaria' => $cantidadNecesaria,
        'cantidad_comprar' => $cantidadComprar,
        'unidades_minimas' => $unidadesMinimas,
        'desperdicio' => $desperdicio,
        'porcentaje_desperdicio' => round($porcentajeDesperdicio, 2),
        'redondeo_aplicado' => true,
        'minimo_comercial' => $minimoComercial
    ];
}

/**
 * Genera un texto descriptivo de la compra a realizar
 * 
 * @param array $calculoResultado Resultado de calcularCantidadComercial
 * @param string $nombreMaterial Nombre del material
 * @param string $presentacionComercial Presentación comercial del material
 * @return string Texto descriptivo
 */
function generarDescripcionCompra($calculoResultado, $nombreMaterial, $presentacionComercial = '') {
    $cantidad = $calculoResultado['cantidad_comprar'];
    $unidades = $calculoResultado['unidades_minimas'];
    $desperdicio = $calculoResultado['desperdicio'];
    $porcentaje = $calculoResultado['porcentaje_desperdicio'];
    
    $texto = "Pedir {$cantidad} unidades de {$nombreMaterial}";
    
    if ($presentacionComercial) {
        $texto .= " ({$unidades} {$presentacionComercial})";
    }
    
    if ($desperdicio > 0) {
        $texto .= " - Desperdicio: {$desperdicio} unidades ({$porcentaje}%)";
    }
    
    return $texto;
}

/**
 * Calcula el impacto en costo del desperdicio
 * 
 * @param array $calculoResultado Resultado de calcularCantidadComercial
 * @param float $precioUnitario Precio por unidad del material
 * @return array Información del impacto en costo
 */
function calcularImpactoDesperdicio($calculoResultado, $precioUnitario) {
    $desperdicio = $calculoResultado['desperdicio'];
    $costoDesperdicio = $desperdicio * $precioUnitario;
    $costoTotal = $calculoResultado['cantidad_comprar'] * $precioUnitario;
    $costoNecesario = $calculoResultado['cantidad_necesaria'] * $precioUnitario;
    
    return [
        'costo_desperdicio' => $costoDesperdicio,
        'costo_total' => $costoTotal,
        'costo_necesario' => $costoNecesario,
        'porcentaje_costo_extra' => $costoNecesario > 0 ? round(($costoDesperdicio / $costoNecesario) * 100, 2) : 0
    ];
}

// Ejemplos de uso:
/*
// Ejemplo 1: Pegamento
$pegamento = calcularCantidadComercial(1.70, 1.0);
echo generarDescripcionCompra($pegamento, 'Pegamento', 'frasco x 1kg');
// Output: "Pedir 2.0 unidades de Pegamento (2 frasco x 1kg) - Desperdicio: 0.3 unidades (17.65%)"

// Ejemplo 2: Cemento
$cemento = calcularCantidadComercial(47.5, 50.0);
echo generarDescripcionCompra($cemento, 'Cemento', 'saco x 50kg');
// Output: "Pedir 50.0 unidades de Cemento (1 saco x 50kg) - Desperdicio: 2.5 unidades (5.26%)"

// Ejemplo 3: Impacto en costo
$impacto = calcularImpactoDesperdicio($pegamento, 15000);
echo "Costo por desperdicio: $" . number_format($impacto['costo_desperdicio'], 2);
echo "Costo extra: {$impacto['porcentaje_costo_extra']}%";
*/
?>
