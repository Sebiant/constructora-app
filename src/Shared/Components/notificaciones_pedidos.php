<?php
/**
 * Componente de notificaciones para pedidos aprobados sin orden de compra
 */

require_once $_SERVER['DOCUMENT_ROOT'] . '/sgigescomnew/config/database.php';

try {
    $db = new Database();
    $connection = $db->getConnection();

    // Contar pedidos aprobados sin orden de compra
    $sql = "SELECT COUNT(*) as total 
            FROM pedidos p 
            LEFT JOIN ordenes_compra oc ON p.id_pedido = oc.id_pedido 
            WHERE p.estado = 'aprobado' 
            GROUP BY p.id_pedido 
            HAVING COUNT(oc.id_orden_compra) = 0";
    
    $stmt = $connection->prepare($sql);
    $stmt->execute();
    $pedidosSinOrden = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $totalPedidos = count($pedidosSinOrden);
    
    if ($totalPedidos > 0) {
        // Obtener detalles de los pedidos
        $sqlDetalles = "SELECT p.id_pedido, p.fecha_pedido, p.total, 
                                pr.nombre as nombre_proyecto, pres.id_presupuesto
                        FROM pedidos p
                        LEFT JOIN presupuestos pres ON p.id_presupuesto = pres.id_presupuesto
                        LEFT JOIN proyectos pr ON pres.id_proyecto = pr.id_proyecto
                        WHERE p.estado = 'aprobado'
                        AND p.id_pedido NOT IN (
                            SELECT DISTINCT id_pedido FROM ordenes_compra
                        )
                        ORDER BY p.fecha_pedido DESC";
        
        $stmtDetalles = $connection->prepare($sqlDetalles);
        $stmtDetalles->execute();
        $detallesPedidos = $stmtDetalles->fetchAll(PDO::FETCH_ASSOC);
    }
    
} catch (Exception $e) {
    $totalPedidos = 0;
    $detallesPedidos = [];
}

// Estilos para la notificación integrada en el card-body
echo '<style>
.notificacion-pedidos {
    position: relative;
    z-index: 10;
    width: 100%;
    margin-bottom: 20px;
}

.notificacion-badge {
    background: linear-gradient(135deg, #dc3545, #c82333);
    color: white;
    padding: 20px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(220, 53, 69, 0.3);
    cursor: pointer;
    font-size: 1.2rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 200px;
    border: 2px solid rgba(255, 255, 255, 0.2);
}

.notificacion-icon {
    display: inline-block;
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    text-align: center;
    line-height: 24px;
    margin-right: 8px;
    font-size: 1rem;
}

@keyframes subtle-glow {
    0%, 100% {
        background: linear-gradient(135deg, #dc3545, #c82333);
        box-shadow: 0 0 20px 30px rgba(220, 53, 69, 0.4);
    }
    50%, 100% {
        background: linear-gradient(135deg, #dc3545, #c82333);
        box-shadow: 0 0 20px 30px rgba(220, 53, 69, 0.4);
    }
    100% {
        background: linear-gradient(135deg, #dc3545, #c82333);
        box-shadow: 0 0 20px 30px rgba(220, 53, 69, 0.4);
    }
}

.notificacion-contenido {
    display: none;
    background: white;
    border-radius: 10px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
    margin-top: 8px;
    max-height: 320px;
    overflow-y: auto;
    animation: slideDown 0.3s ease;
    border: 1px solid rgba(0, 0, 0, 0.08);
    position: relative;
    z-index: 100;
}

.notificacion-contenido.show {
    display: block;
}

.notificacion-header {
    background: linear-gradient(135deg, #dc3545, #c82333);
    color: white;
    padding: 12px 16px;
    border-radius: 10px 10px 0 0;
    font-weight: 600;
    font-size: 0.85rem;
}

.notificacion-body {
    padding: 0;
}

.pedido-item {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.2s ease;
}

.pedido-item:hover {
    background-color: #f8f9fa;
}

.pedido-item:last-child {
    border-bottom: none;
    border-radius: 0 0 10px 10px;
}

.pedido-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.pedido-id {
    font-weight: 600;
    color: #2c3e50;
    font-size: 0.8rem;
}

.pedido-fecha {
    font-size: 0.7rem;
    color: #7f8c8d;
}

.pedido-detalle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    margin-bottom: 8px;
}

.pedido-proyecto {
    color: #34495e;
}

.pedido-total {
    font-weight: 600;
    color: #27ae60;
}

.pedido-acciones {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
}

.btn-crear-orden-individual {
    background: linear-gradient(135deg, #28a745, #218838);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    font-size: 0.75rem;
}

.btn-crear-orden-individual:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
    background: linear-gradient(135deg, #218838, #28a745);
}

.btn-crear-orden-individual i {
    margin-right: 4px;
    font-size: 0.7rem;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .notificacion-badge {
        font-size: 0.8rem;
        padding: 10px 14px;
    }
    
    .notificacion-icon {
        width: 18px;
        height: 18px;
        line-height: 18px;
        margin-right: 6px;
        font-size: 0.7rem;
    }
    
    .notificacion-contenido {
        max-height: 280px;
    }
    
    .pedido-detalle {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }
    
    .pedido-acciones {
        justify-content: center;
        margin-top: 12px;
    }
}

@media (max-width: 480px) {
    .notificacion-badge {
        font-size: 0.75rem;
        padding: 8px 12px;
    }
    
    .notificacion-icon {
        width: 16px;
        height: 16px;
        line-height: 16px;
        margin-right: 5px;
        font-size: 0.65rem;
    }
    
    .notificacion-contenido {
        max-height: 250px;
    }
    
    .btn-crear-orden-individual {
        padding: 5px 10px;
        font-size: 0.7rem;
    }
}
</style>';

if ($totalPedidos > 0): ?>
<div class="notificacion-pedidos">
    <div class="notificacion-badge" onclick="toggleNotificacionPedidos()">
        <span class="notificacion-icon">!</span>
        <span>
            <strong><?php echo $totalPedidos; ?></strong> pedido<?php echo $totalPedidos > 1 ? 's' : ''; ?> aprobado<?php echo $totalPedidos > 1 ? 's' : ''; ?> sin orden de compra
        </span>
    </div>
    
    <div class="notificacion-contenido" id="notificacionContenido">
        <div class="notificacion-header">
            📋 Pedidos Aprobados Sin Orden de Compra
        </div>
        
        <div class="notificacion-body">
            <?php if (!empty($detallesPedidos)): ?>
                <?php foreach ($detallesPedidos as $pedido): ?>
                    <div class="pedido-item">
                        <div class="pedido-info">
                            <span class="pedido-id">Pedido #<?php echo $pedido['id_pedido']; ?></span>
                            <span class="pedido-fecha"><?php echo date('d/m/Y', strtotime($pedido['fecha_pedido'])); ?></span>
                        </div>
                        <div class="pedido-detalle">
                            <span class="pedido-proyecto"><?php echo htmlspecialchars($pedido['nombre_proyecto']); ?></span>
                            <span class="pedido-total">$<?php echo number_format($pedido['total'], 2, ',', '.'); ?></span>
                        </div>
                        <div class="pedido-acciones">
                            <a href="/sgigescomnew/src/OrdenesCompra/Interfaces/Views/ordenesCompraView.php?action=nueva&id_pedido=<?php echo $pedido['id_pedido']; ?>" 
                               class="btn-crear-orden-individual"
                               onclick="event.preventDefault(); console.log('🚀 Botón de notificación presionado para pedido #<?php echo $pedido['id_pedido']; ?>'); 
                                       // Abrir modal y autollenar con el pedido
                                       const abrir = () => {
                                         if (window.OrdenesCompraUI && typeof OrdenesCompraUI.abrirNuevaOrdenConPedido === 'function') {
                                           OrdenesCompraUI.abrirNuevaOrdenConPedido(<?php echo $pedido['id_pedido']; ?>);
                                         } else {
                                           // Fallback mínimo: mostrar modal si el UI aún no está listo
                                           const modal = document.getElementById('modalOrdenCompra');
                                           if (modal) {
                                             const modalInstance = new bootstrap.Modal(modal);
                                             modalInstance.show();
                                           }
                                         }
                                       };
                                       setTimeout(abrir, 100);">
                                <i class="bi bi-plus-circle"></i>
                                Crear Orden de Compra
                            </a>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <div class="pedido-item">
                    <div style="text-align: center; padding: 20px; color: #7f8c8d;">
                        No se encontraron detalles de los pedidos
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<script>
function toggleNotificacionPedidos() {
    const contenido = document.getElementById('notificacionContenido');
    contenido.classList.toggle('show');
}

// Cerrar notificación al hacer clic fuera
document.addEventListener('click', function(event) {
    const notificacion = document.querySelector('.notificacion-pedidos');
    if (!notificacion.contains(event.target)) {
        document.getElementById('notificacionContenido').classList.remove('show');
    }
});

// Auto-refresh cada 5 minutos
setInterval(function() {
    location.reload();
}, 300000);
</script>
<?php endif; ?>
