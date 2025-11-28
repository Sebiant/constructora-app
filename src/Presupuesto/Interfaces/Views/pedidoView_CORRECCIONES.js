/**
 * CORRECCIONES PARA EXPORTACIÓN DE EXCEL
 * 
 * Este archivo contiene las funciones corregidas para generarHojaResumenInsumosExcel y
 * generarHojaDetallePorItemsExcel con las siguientes correcciones:
 * 
 * 1. Desbordamiento de color corregido en filas de grupo (G1, G2, G3, G4)
 * 2. Código de componente agregado en detalle por items
 * 3. Columna "Pedido Actual" reemplazada por "Excedente" + "Justificación"
 * 
 * INSTRUCCIONES:
 * - Reemplazar la función generarDatosResumen (líneas 2530-2617)
 * - Reemplazar la función generarHojaResumenInsumosExcel (líneas 2665-2917)
 * - Reemplazar la función generarHojaDetallePorItemsExcel (líneas 2922-3074)
 */

// ============================================================================
// FUNCIÓN 1: generarDatosResumen (MODIFICADA)
// ============================================================================
function generarDatosResumen() {
    const componentesPorItem = new Map();
    let valorTotalGlobal = 0;
    let totalComponentesContados = 0;
    let componentesCompletados = 0;

    if (!itemsData.componentesAgrupados) {
        return {
            totalItems: 0,
            totalComponentes: 0,
            componentesCompletados: 0,
            valorTotal: 0,
            componentesPorItem: []
        };
    }

    // Agrupar todos los componentes por item
    itemsData.componentesAgrupados.forEach(componente => {
        if (!componente.items_que_usan || !Array.isArray(componente.items_que_usan)) {
            return;
        }

        componente.items_que_usan.forEach(item => {
            const cantidadTotal = parseFloat(item.cantidad_componente) || 0;
            const yaPedido = parseFloat(item.ya_pedido_item) || 0;
            const pedidoActual = parseFloat(item.pedido_actual) || 0;
            const pendiente = Math.max(0, cantidadTotal - yaPedido - pedidoActual);
            const precioUnitario = parseFloat(componente.precio_unitario) || 0;

            const porcentaje = cantidadTotal > 0 ? ((yaPedido + pedidoActual) / cantidadTotal) * 100 : 0;
            const subtotal = (yaPedido + pedidoActual) * precioUnitario;

            const itemKey = item.codigo_item;

            if (!componentesPorItem.has(itemKey)) {
                componentesPorItem.set(itemKey, {
                    codigoItem: item.codigo_item,
                    nombreItem: item.nombre_item,
                    capitulo: item.nombre_capitulo || 'N/A',
                    componentes: [],
                    valorTotal: 0,
                    cantidadTotalGlobal: 0,
                    cantidadCompletadaGlobal: 0,
                    porcentajeGlobal: 0
                });
            }

            const itemData = componentesPorItem.get(itemKey);

            // NUEVO: Buscar justificación de pedido extra si existe
            const pedidoExtra = pedidosFueraPresupuesto.find(
                p => p.id_componente === componente.id_componente && p.id_item === item.id_item
            );
            const cantidadMaxima = Math.max(0, cantidadTotal - yaPedido);
            const excedente = Math.max(0, pedidoActual - cantidadMaxima);

            itemData.componentes.push({
                codigo: componente.codigo_componente || componente.id_componente || '',  // NUEVO
                nombre: componente.nombre_componente,
                tipo: componente.tipo_componente,
                unidad: componente.unidad_componente || 'UND',
                cantidadTotal: cantidadTotal,
                yaPedido: yaPedido,
                pedidoActual: pedidoActual,
                excedente: excedente,  // NUEVO
                justificacion: pedidoExtra ? pedidoExtra.justificacion : '',  // NUEVO
                pendiente: pendiente,
                porcentaje: porcentaje,
                precioUnitario: precioUnitario,
                subtotal: subtotal,
                idComponente: componente.id_componente,  // NUEVO
                idItem: item.id_item  // NUEVO
            });

            itemData.valorTotal += subtotal;
            itemData.cantidadTotalGlobal += cantidadTotal;
            itemData.cantidadCompletadaGlobal += (yaPedido + pedidoActual);

            valorTotalGlobal += subtotal;
            totalComponentesContados++;

            if (porcentaje >= 100) {
                componentesCompletados++;
            }
        });
    });

    // Calcular porcentaje global para cada item
    componentesPorItem.forEach(itemData => {
        itemData.porcentajeGlobal = itemData.cantidadTotalGlobal > 0
            ? (itemData.cantidadCompletadaGlobal / itemData.cantidadTotalGlobal) * 100
            : 0;
    });

    return {
        totalItems: componentesPorItem.size,
        totalComponentes: totalComponentesContados,
        componentesCompletados: componentesCompletados,
        valorTotal: valorTotalGlobal,
        componentesPorItem: Array.from(componentesPorItem.values())
    };
}

// ============================================================================
// FUNCIÓN 2: generarHojaResumenInsumosExcel (MODIFICADA - CORREGIR DESBORDAMIENTO)
// ============================================================================
async function generarHojaResumenInsumosExcel(workbook, datosResumen) {
    const worksheet = workbook.addWorksheet('Resumen de Insumos');

    const proyectoNombre = seleccionActual?.proyecto || 'FIRMA CONSTRUCTORA';
    const presupuestoNombre = seleccionActual?.presupuesto || 'PRESUPUESTO';
    const fechaActual = new Date().toLocaleDateString('es-CO');

    // Configurar anchos de columna
    worksheet.columns = [
        { key: 'codigo', width: 12 },
        { key: 'clasif', width: 18 },
        { key: 'descripcion', width: 55 },
        { key: 'und', width: 10 },
        { key: 'cant', width: 10 },
        { key: 'vr_unit', width: 18 },
        { key: 'vr_total', width: 18 }
    ];

    let filaActual = 1;

    // ENCABEZADO PRINCIPAL
    worksheet.mergeCells(`A${filaActual}:G${filaActual}`);
    const celda1 = worksheet.getCell(`A${filaActual}`);
    celda1.value = proyectoNombre;
    celda1.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    celda1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    celda1.alignment = { horizontal: 'center', vertical: 'middle' };
    celda1.border = borderCompleto();
    worksheet.getRow(filaActual).height = 25;
    filaActual++;

    // SUBTÍTULO
    worksheet.mergeCells(`A${filaActual}:G${filaActual}`);
    const celda2 = worksheet.getCell(`A${filaActual}`);
    celda2.value = 'RESUMEN DE INSUMOS';
    celda2.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    celda2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    celda2.alignment = { horizontal: 'center', vertical: 'middle' };
    celda2.border = borderCompleto();
    worksheet.getRow(filaActual).height = 22;
    filaActual++;

    // INFO PROCESO Y FECHA
    const fila3 = worksheet.getRow(filaActual);
    fila3.getCell(6).value = 'PROCESO No.';
    fila3.getCell(7).value = '0';
    aplicarEstiloCelda(fila3.getCell(6), { bold: true }, 'right');
    aplicarEstiloCelda(fila3.getCell(7), {}, 'left');
    filaActual++;

    const fila4 = worksheet.getRow(filaActual);
    fila4.getCell(6).value = 'FECHA:';
    fila4.getCell(7).value = fechaActual;
    aplicarEstiloCelda(fila4.getCell(6), { bold: true }, 'right');
    aplicarEstiloCelda(fila4.getCell(7), {}, 'left');
    filaActual++;

    // LÍNEA VACÍA
    filaActual++;

    // ENCABEZADOS DE COLUMNAS PRINCIPALES
    const encabezados = worksheet.getRow(filaActual);
    encabezados.values = ['CODIGO', 'CLASIF', 'DESCRIPCION', 'UND', 'CANT.', 'VR. UNIT.', 'VR. TOTAL'];
    encabezados.font = { bold: true, size: 10 };
    encabezados.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    encabezados.alignment = { horizontal: 'center', vertical: 'middle' };
    encabezados.height = 20;
    encabezados.eachCell((cell) => { cell.border = borderCompleto(); });
    filaActual++;

    // LÍNEA VACÍA
    filaActual++;

    // Agrupar componentes por tipo
    const componentesPorTipo = agruparComponentesPorTipoParaExcel(datosResumen);

    // MATERIALES (G1) - CORREGIDO: limitar border a columnas A-G
    if (componentesPorTipo.material.length > 0) {
        const totalMateriales = componentesPorTipo.material.reduce((sum, c) => sum + c.valorTotal, 0);
        const filaG1 = worksheet.getRow(filaActual);
        filaG1.values = ['G1', '', 'MATERIALES', '', '', '', totalMateriales];
        filaG1.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        filaG1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203764' } };
        filaG1.alignment = { horizontal: 'left', vertical: 'middle' };
        filaG1.height = 22;
        // CORREGIDO: Aplicar border solo a las columnas A-G (1-7)
        for (let col = 1; col <= 7; col++) {
            filaG1.getCell(col).border = borderCompleto();
        }
        filaG1.getCell(7).numFmt = '#,##0.00';
        filaActual++;

        // Subencabezados
        const subEnc = worksheet.getRow(filaActual);
        subEnc.values = ['CODIGO', 'CLASIF', 'DESCRIPCION', 'UND', 'CANT.', 'VR. UNIT.', 'VR. TOTAL'];
        subEnc.font = { bold: true, size: 9 };
        subEnc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        subEnc.alignment = { horizontal: 'center', vertical: 'middle' };
        subEnc.eachCell((cell) => { cell.border = borderCompleto(); });
        filaActual++;

        // Items de materiales
        componentesPorTipo.material.forEach(comp => {
            const fila = worksheet.getRow(filaActual);
            fila.values = [
                comp.codigo,
                comp.clasificacion,
                comp.descripcion,
                comp.unidad,
                1,
                comp.cantidad,
                comp.precioUnitario,
                comp.valorTotal
            ];
            fila.alignment = { horizontal: 'left', vertical: 'middle' };
            fila.eachCell((cell, colNum) => {
                cell.border = borderCompleto();
                if (colNum >= 5) {
                    cell.numFmt = '#,##0.0000';
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                }
                if (colNum === 7 || colNum === 8) {
                    cell.numFmt = '#,##0.00';
                }
            });
            filaActual++;
        });

        filaActual++; // Línea vacía
    }

    // MANO DE OBRA (G2) - CORREGIDO
    if (componentesPorTipo.mano_obra.length > 0) {
        const totalMO = componentesPorTipo.mano_obra.reduce((sum, c) => sum + c.valorTotal, 0);
        const filaG2 = worksheet.getRow(filaActual);
        filaG2.values = ['G2', '', 'MANO DE OBRA', '', '', '', totalMO];
        filaG2.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        filaG2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203764' } };
        filaG2.alignment = { horizontal: 'left', vertical: 'middle' };
        filaG2.height = 22;
        // CORREGIDO: Aplicar border solo a las columnas A-G (1-7)
        for (let col = 1; col <= 7; col++) {
            filaG2.getCell(col).border = borderCompleto();
        }
        filaG2.getCell(7).numFmt = '#,##0.00';
        filaActual++;

        const subEnc = worksheet.getRow(filaActual);
        subEnc.values = ['CODIGO', 'CLASIF', 'DESCRIPCION', 'UND', 'CANT.', 'VR. UNIT.', 'VR. TOTAL'];
        subEnc.font = { bold: true, size: 9 };
        subEnc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        subEnc.alignment = { horizontal: 'center', vertical: 'middle' };
        subEnc.eachCell((cell) => { cell.border = borderCompleto(); });
        filaActual++;

        componentesPorTipo.mano_obra.forEach(comp => {
            const fila = worksheet.getRow(filaActual);
            fila.values = [comp.codigo, comp.clasificacion, comp.descripcion, comp.unidad, 1, comp.cantidad, comp.precioUnitario, comp.valorTotal];
            fila.alignment = { horizontal: 'left', vertical: 'middle' };
            fila.eachCell((cell, colNum) => {
                cell.border = borderCompleto();
                if (colNum >= 5) {
                    cell.numFmt = '#,##0.0000';
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                }
                if (colNum === 7 || colNum === 8) cell.numFmt = '#,##0.00';
            });
            filaActual++;
        });
        filaActual++;
    }

    // EQUIPO (G3) - CORREGIDO
    if (componentesPorTipo.equipo.length > 0) {
        const totalEq = componentesPorTipo.equipo.reduce((sum, c) => sum + c.valorTotal, 0);
        const filaG3 = worksheet.getRow(filaActual);
        filaG3.values = ['G3', '', 'EQUIPO', '', '', '', totalEq];
        filaG3.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        filaG3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203764' } };
        filaG3.alignment = { horizontal: 'left', vertical: 'middle' };
        filaG3.height = 22;
        // CORREGIDO: Aplicar border solo a las columnas A-G (1-7)
        for (let col = 1; col <= 7; col++) {
            filaG3.getCell(col).border = borderCompleto();
        }
        filaG3.getCell(7).numFmt = '#,##0.00';
        filaActual++;

        const subEnc = worksheet.getRow(filaActual);
        subEnc.values = ['CODIGO', 'CLASIF', 'DESCRIPCION', 'UND', 'CANT.', 'VR. UNIT.', 'VR. TOTAL'];
        subEnc.font = { bold: true, size: 9 };
        subEnc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        subEnc.alignment = { horizontal: 'center', vertical: 'middle' };
        subEnc.eachCell((cell) => { cell.border = borderCompleto(); });
        filaActual++;

        componentesPorTipo.equipo.forEach(comp => {
            const fila = worksheet.getRow(filaActual);
            fila.values = [comp.codigo, comp.clasificacion, comp.descripcion, comp.unidad, 1, comp.cantidad, comp.precioUnitario, comp.valorTotal];
            fila.alignment = { horizontal: 'left', vertical: 'middle' };
            fila.eachCell((cell, colNum) => {
                cell.border = borderCompleto();
                if (colNum >= 5) {
                    cell.numFmt = '#,##0.0000';
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                }
                if (colNum === 7 || colNum === 8) cell.numFmt = '#,##0.00';
            });
            filaActual++;
        });
        filaActual++;
    }

    // OTROS/TRANSPORTE (G4) - CORREGIDO
    if (componentesPorTipo.transporte.length > 0) {
        const totalTr = componentesPorTipo.transporte.reduce((sum, c) => sum + c.valorTotal, 0);
        const filaG4 = worksheet.getRow(filaActual);
        filaG4.values = ['G4', '', 'OTROS', '', '', '', totalTr];
        filaG4.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        filaG4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203764' } };
        filaG4.alignment = { horizontal: 'left', vertical: 'middle' };
        filaG4.height = 22;
        // CORREGIDO: Aplicar border solo a las columnas A-G (1-7)
        for (let col = 1; col <= 7; col++) {
            filaG4.getCell(col).border = borderCompleto();
        }
        filaG4.getCell(7).numFmt = '#,##0.00';
        filaActual++;

        const subEnc = worksheet.getRow(filaActual);
        subEnc.values = ['CODIGO', 'CLASIF', 'DESCRIPCION', 'UND', 'CANT.', 'VR. UNIT.', 'VR. TOTAL'];
        subEnc.font = { bold: true, size: 9 };
        subEnc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        subEnc.alignment = { horizontal: 'center', vertical: 'middle' };
        subEnc.eachCell((cell) => { cell.border = borderCompleto(); });
        filaActual++;

        componentesPorTipo.transporte.forEach(comp => {
            const fila = worksheet.getRow(filaActual);
            fila.values = [comp.codigo, comp.clasificacion, comp.descripcion, comp.unidad, 1, comp.cantidad, comp.precioUnitario, comp.valorTotal];
            fila.alignment = { horizontal: 'left', vertical: 'middle' };
            fila.eachCell((cell, colNum) => {
                cell.border = borderCompleto();
                if (colNum >= 5) {
                    cell.numFmt = '#,##0.0000';
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                }
                if (colNum === 7 || colNum === 8) cell.numFmt = '#,##0.00';
            });
            filaActual++;
        });
        filaActual++;
    }

    // TOTAL FINAL
    filaActual++;
    const filaTotal = worksheet.getRow(filaActual);
    filaTotal.values = ['', '', '', '', '', 'VALOR TOTAL INSUMOS', datosResumen.valorTotal];
    filaTotal.font = { bold: true, size: 11 };
    filaTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
    filaTotal.alignment = { horizontal: 'right', vertical: 'middle' };
    filaTotal.height = 22;
    filaTotal.eachCell((cell) => { cell.border = borderCompleto(); });
    filaTotal.getCell(7).numFmt = '#,##0.00';
}

// ============================================================================
// FUNCIÓN 3: generarHojaDetallePorItemsExcel (MODIFICADA - EXCEDENTE + JUSTIFICACIÓN)
// ============================================================================
async function generarHojaDetallePorItemsExcel(workbook, datosResumen) {
    const worksheet = workbook.addWorksheet('Detalle por Items');

    // MODIFICADO: Agregar columna para justificación
    worksheet.columns = [
        { key: 'cod_item', width: 13 },
        { key: 'nom_item', width: 35 },
        { key: 'capitulo', width: 22 },
        { key: 'cod_comp', width: 13 },
        { key: 'componente', width: 45 },
        { key: 'tipo', width: 14 },
        { key: 'unidad', width: 9 },
        { key: 'cant_total', width: 12 },
        { key: 'ya_pedido', width: 12 },
        { key: 'excedente', width: 13 },        // CAMBIADO: pedido_actual -> excedente
        { key: 'pendiente', width: 12 },
        { key: 'avance', width: 11 },
        { key: 'precio', width: 14 },
        { key: 'subtotal', width: 16 },
        { key: 'justificacion', width: 40 }     // NUEVO
    ];

    let filaActual = 1;

    // TÍTULO PRINCIPAL - MODIFICADO: Ahora son 15 columnas (A-O)
    worksheet.mergeCells(`A${filaActual}:O${filaActual}`);
    const titulo = worksheet.getCell(`A${filaActual}`);
    titulo.value = 'DETALLE POR ITEMS DEL PRESUPUESTO';
    titulo.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    titulo.alignment = { horizontal: 'center', vertical: 'middle' };
    titulo.border = borderCompleto();
    worksheet.getRow(filaActual).height = 25;
    filaActual++;

    // INFO DEL PROYECTO
    const fila2 = worksheet.getRow(filaActual);
    fila2.getCell(1).value = 'Proyecto:';
    fila2.getCell(2).value = seleccionActual?.proyecto || 'N/A';
    fila2.getCell(1).font = { bold: true };
    filaActual++;

    const fila3 = worksheet.getRow(filaActual);
    fila3.getCell(1).value = 'Presupuesto:';
    fila3.getCell(2).value = seleccionActual?.presupuesto || 'N/A';
    fila3.getCell(1).font = { bold: true };
    filaActual++;

    const fila4 = worksheet.getRow(filaActual);
    fila4.getCell(1).value = 'Fecha:';
    fila4.getCell(2).value = new Date().toLocaleDateString('es-CO');
    fila4.getCell(1).font = { bold: true };
    filaActual++;

    // LÍNEA VACÍA
    filaActual++;

    // ENCABEZADOS - MODIFICADO: Cambiar "Pedido Actual" por "Excedente" y agregar "Justificación"
    const encabezados = worksheet.getRow(filaActual);
    encabezados.values = [
        'Código Item', 'Nombre Item', 'Capítulo', 'Código Comp.', 'Componente',
        'Tipo', 'Unidad', 'Cant. Total', 'Ya Pedido', 'Excedente',          // CAMBIADO
        'Pendiente', '% Avance', 'Precio Unit.', 'Subtotal', 'Justificación'  // NUEVO
    ];
    encabezados.font = { bold: true, size: 10 };
    encabezados.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    encabezados.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    encabezados.height = 30;
    encabezados.eachCell((cell) => { cell.border = borderCompleto(); });
    filaActual++;

    // DATOS POR ITEM
    datosResumen.componentesPorItem.forEach(item => {
        item.componentes.forEach((comp, idx) => {
            const fila = worksheet.getRow(filaActual);

            if (idx === 0) {
                // Primera fila del item
                fila.values = [
                    item.codigoItem,
                    item.nombreItem,
                    item.capitulo,
                    comp.codigo || '',           // MODIFICADO: Ahora muestra el código
                    comp.nombre,
                    obtenerNombreTipoComponente(comp.tipo),
                    comp.unidad,
                    comp.cantidadTotal,
                    comp.yaPedido,
                    comp.excedente || 0,         // MODIFICADO: Muestra excedente en lugar de pedidoActual
                    comp.pendiente,
                    comp.porcentaje / 100,
                    comp.precioUnitario,
                    comp.subtotal,
                    comp.justificacion || ''     // NUEVO
                ];
            } else {
                // Filas adicionales
                fila.values = [
                    '', '', '',
                    comp.codigo || '',           // MODIFICADO: Ahora muestra el código
                    comp.nombre,
                    obtenerNombreTipoComponente(comp.tipo),
                    comp.unidad,
                    comp.cantidadTotal,
                    comp.yaPedido,
                    comp.excedente || 0,         // MODIFICADO
                    comp.pendiente,
                    comp.porcentaje / 100,
                    comp.precioUnitario,
                    comp.subtotal,
                    comp.justificacion || ''     // NUEVO
                ];
            }

            // Aplicar estilos
            fila.alignment = { horizontal: 'left', vertical: 'middle' };
            fila.eachCell((cell, colNum) => {
                cell.border = borderLigero();

                // Alineación y formato numérico
                if (colNum >= 8 && colNum <= 11) {
                    cell.numFmt = '#,##0.0000';
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                }
                if (colNum === 12) {
                    cell.numFmt = '0.0%';
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                }
                if (colNum === 13 || colNum === 14) {
                    cell.numFmt = '#,##0.00';
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                }
                if (colNum === 15) {
                    // Justificación 
                    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
                }
            });

            filaActual++;
        });

        // Línea vacía entre items
        filaActual++;
    });

    // TOTALES - MODIFICADO: Ahora son 15 columnas
    filaActual++;
    const filaTotal = worksheet.getRow(filaActual);
    filaTotal.values = ['', '', '', '', '', '', '', '', '', '', 'TOTAL:', '', '', datosResumen.valorTotal, ''];
    filaTotal.font = { bold: true, size: 11 };
    filaTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
    filaTotal.alignment = { horizontal: 'right', vertical: 'middle' };
    filaTotal.height = 22;
    filaTotal.eachCell((cell) => {
        cell.border = borderCompleto();
        if (cell.col === 14) {
            cell.numFmt = '#,##0.00';
        }
    });
}

/**
 * NOTA: Las demás funciones (borderCompleto, borderLigero, aplicarEstiloCelda,
 * agruparComponentesPorTipoParaExcel, etc.) se mantienen igual.
 */
