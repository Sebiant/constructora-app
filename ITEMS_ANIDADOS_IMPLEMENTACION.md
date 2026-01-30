# Implementación de Items Anidados (Nested Items)

## Descripción General

Se ha implementado la funcionalidad completa para crear **items anidados** (items dentro de items) en el módulo de gestión de ítems. Esta funcionalidad permite construir jerarquías de ítems donde un ítem puede contener otros ítems como componentes, similar a cómo "Aviso de Pare" puede requerir "Mezcla de Concreto".

## Estructura de Base de Datos

La funcionalidad utiliza las siguientes tablas:

### 1. `items`
- **Campos relevantes**:
  - `es_compuesto`: Indica si el ítem está compuesto por otros ítems
  - `id_item_padre`: Referencia al ítem padre (si existe)
  - `nivel`: Nivel de anidación en la jerarquía
  - `ruta_jerarquia`: Ruta completa en la jerarquía

### 2. `item_composicion`
- **Campos principales**:
  - `id_composicion`: ID único de la relación
  - `id_item_compuesto`: ID del ítem padre (el que contiene)
  - `id_item_componente`: ID del ítem hijo (el que es contenido)
  - `cantidad`: Cantidad del ítem hijo necesaria
  - `orden`: Orden de visualización
  - `es_referencia`: Indica si es una referencia o una copia
  - `idestado`: Estado activo/inactivo

### 3. `item_componentes`
- Contiene los componentes básicos (materiales, mano de obra, equipo)
- Se mantiene separado de la composición de ítems

## Funcionalidad Implementada

### Frontend (JavaScript)

#### Nuevas Variables de Estado
```javascript
draftComposition: []  // Items anidados en borrador
removedCompositionIds: new Set()  // IDs de composiciones eliminadas
loadingDraftComposition: false  // Estado de carga
```

#### Funciones Principales

1. **`resetDraftComposition()`**
   - Limpia el estado de items anidados
   - Resetea el renderizado

2. **`populateItemsSelectForComposition()`**
   - Llena el selector con items disponibles
   - Excluye el item actual para evitar referencias circulares

3. **`addItemFromSelect()`**
   - Agrega un ítem seleccionado a la composición
   - Valida duplicados
   - Inicializa con cantidad 1 y orden automático

4. **`renderDraftComposition()`**
   - Renderiza la tabla de items anidados
   - Muestra código, nombre, unidad, cantidad
   - Permite editar cantidad inline
   - Botón para eliminar items

5. **`updateDraftCompositionField(index, field, value)`**
   - Actualiza campos de items anidados
   - Soporta cantidad, orden, es_referencia

6. **`removeDraftCompositionItem(index)`**
   - Elimina un ítem de la composición
   - Marca para eliminación si ya estaba persistido
   - Reordena automáticamente

7. **`loadItemCompositionForModal(itemId)`**
   - Carga la composición existente al editar
   - Convierte datos de API a formato de borrador

8. **`serializeDraftComposition()`**
   - Serializa items anidados para envío al backend
   - Formato compatible con el controlador PHP

### Backend (PHP)

#### Endpoint `createItemWithRelations`
Ya existía y se modificó para procesar el array `composicion`:
```php
$composicion = $payload['composicion'] ?? [];

if (!empty($composicion)) {
    foreach ($composicion as $comp) {
        // Inserta en item_composicion
        $stmtComposicion->execute([
            $itemId,
            $idItemComponente,
            $cantidadCompuesta,
            $usuarioId,
            $orden,
            $esReferencia
        ]);
    }
}
```

#### Endpoint `updateItem` (Modificado)
Se agregó soporte para actualizar composición:
```php
$composicion = $data['composicion'] ?? [];
$removedComposition = $data['removed_composition_ids'] ?? [];

// Eliminar composiciones removidas
if (!empty($removedComposition)) {
    // UPDATE item_composicion SET idestado = 0 WHERE ...
}

// Insertar o actualizar composiciones
if (!empty($composicion)) {
    // INSERT ... ON DUPLICATE KEY UPDATE ...
}
```

### Interfaz de Usuario (HTML)

Se agregó una nueva sección en el modal de items (`modalItem`):

```html
<!-- Sección de Ítems Anidados -->
<div class="mt-4 border-top pt-4" id="itemCompositionBuilderSection">
    <!-- Selector de items -->
    <select class="form-select" id="draftItemSelect">
        <option value="">Seleccionar ítem...</option>
    </select>
    <button onclick="ItemsUI.addItemFromSelect()">Agregar</button>
    
    <!-- Contenedor de items agregados -->
    <div id="itemCompositionDraftContainer">
        <!-- Tabla dinámica renderizada por JS -->
    </div>
</div>
```

## Flujo de Uso

### Crear Item con Items Anidados

1. Usuario abre modal "Nuevo Ítem"
2. Completa datos básicos del ítem
3. (Opcional) Agrega componentes básicos (materiales, mano de obra)
4. En sección "Ítems anidados":
   - Selecciona un ítem existente del dropdown
   - Click en "Agregar"
   - Ajusta cantidad si es necesario
5. Click en "Guardar"
6. Backend:
   - Crea el ítem en tabla `items`
   - Inserta componentes en `item_componentes`
   - Inserta relaciones en `item_composicion`

### Editar Item con Items Anidados

1. Usuario click en "Editar" de un ítem
2. Modal carga:
   - Datos básicos del ítem
   - Componentes existentes
   - **Items anidados existentes** (nueva funcionalidad)
3. Usuario puede:
   - Agregar nuevos items anidados
   - Modificar cantidades de items existentes
   - Eliminar items anidados
4. Click en "Guardar"
5. Backend:
   - Actualiza ítem
   - Actualiza/inserta componentes
   - **Actualiza/inserta/elimina composiciones**

## Ejemplo de Datos

### Request al crear item con items anidados:
```json
{
  "item": {
    "codigo_item": "APU-001",
    "nombre_item": "Aviso de Pare",
    "unidad": "UND",
    "es_compuesto": 1
  },
  "componentes": [
    {
      "tipo_componente": "material",
      "id_material": 5,
      "descripcion": "Pintura roja",
      "cantidad": 2,
      "precio_unitario": 15000
    }
  ],
  "composicion": [
    {
      "id_item_componente": 12,  // ID de "Mezcla de Concreto"
      "cantidad": 0.5,
      "orden": 1,
      "es_referencia": 1
    },
    {
      "id_item_componente": 15,  // ID de "Poste metálico"
      "cantidad": 1,
      "orden": 2,
      "es_referencia": 1
    }
  ]
}
```

### Response:
```json
{
  "success": true,
  "message": "Ítem y componentes creados correctamente",
  "id_item": 45
}
```

## Validaciones Implementadas

1. **No auto-referencia**: Un ítem no puede contenerse a sí mismo
2. **No duplicados**: No se puede agregar el mismo ítem dos veces
3. **Cantidad mínima**: La cantidad debe ser mayor a 0
4. **Items activos**: Solo se muestran items con `idestado = 1`

## Archivos Modificados

### JavaScript
- `src/Items/Interfaces/Views/itemsGestionView.js`
  - Líneas 2-40: Estado actualizado
  - Líneas 525-570: `prepareItemModal` modificado
  - Líneas 584-640: `submitItem` modificado
  - Líneas 1945-2165: Nuevas funciones de composición
  - Líneas 2167-2200: Exportación de funciones

### PHP
- `src/Items/Interfaces/ItemsController.php`
  - Líneas 367-535: Caso `updateItem` modificado para soportar composición

### HTML
- `src/Items/Interfaces/Views/itemsGestionView.php`
  - Líneas 516-568: Nueva sección de items anidados en modal

## Próximos Pasos Sugeridos

1. **Visualización de jerarquía**: Agregar vista de árbol para ver la estructura completa
2. **Cálculo de costos**: Calcular automáticamente el costo total incluyendo items anidados
3. **Validación de ciclos**: Prevenir referencias circulares (A contiene B, B contiene A)
4. **Límite de profundidad**: Establecer nivel máximo de anidación
5. **Exportación**: Incluir items anidados en reportes y exportaciones

## Notas Técnicas

- La funcionalidad usa `ON DUPLICATE KEY UPDATE` para manejar inserciones/actualizaciones
- Los items eliminados se marcan con `idestado = 0` (soft delete)
- El campo `es_referencia` permite diferenciar entre copias y referencias
- El campo `orden` permite ordenar la visualización de items anidados
- La validación de duplicados se hace en el frontend para mejor UX

## Testing

Para probar la funcionalidad:

1. Crear un ítem simple (ej: "Mezcla de Concreto")
2. Crear un segundo ítem que contenga al primero (ej: "Aviso de Pare")
3. Verificar que se guarda correctamente
4. Editar el segundo ítem y modificar la cantidad
5. Verificar que los cambios persisten
6. Eliminar un ítem anidado y verificar que se marca como inactivo

## Soporte

Para dudas o problemas, revisar:
- Consola del navegador para errores de JavaScript
- Network tab para ver requests/responses
- Logs de PHP para errores del backend
