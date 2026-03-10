<?php
// Get project ID from session storage (will be set by JavaScript)
$idProyecto = isset($_GET['id_proyecto']) ? (int)$_GET['id_proyecto'] : null;
$idPresupuesto = isset($_GET['id_presupuesto']) ? (int)$_GET['id_presupuesto'] : null;

include $_SERVER['DOCUMENT_ROOT'] . '/sgigescon/src/Capitulos/Interfaces/Views/capitulosDataTable.php';
?>

<script>
// Check if we're in project inspection mode
const selectedProjectId = sessionStorage.getItem('selectedProjectId');
const isProjectMode = sessionStorage.getItem('isInProjectMode') === 'true';

// Set the project filter if in inspection mode
const ID_PROYECTO_FILTRO = isProjectMode && selectedProjectId ? parseInt(selectedProjectId) : <?php echo $idProyecto ?? 'null'; ?>;
const ID_PRESUPUESTO_FILTRO = <?php echo $idPresupuesto ?? 'null'; ?>;
const API_CAPITULOS = '/sgigescon/src/Capitulos/Interfaces/CapituloController.php';

console.log('Capítulos - Proyecto filtrado:', ID_PROYECTO_FILTRO);
</script>

<script src="/sgigescon/src/Capitulos/Interfaces/Views/capitulosDataTable.js"></script>
