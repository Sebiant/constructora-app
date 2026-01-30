<?php
$idPresupuesto = isset($_GET['id_presupuesto']) ? (int)$_GET['id_presupuesto'] : null;

include $_SERVER['DOCUMENT_ROOT'] . '/sgigescomnew/src/Capitulos/Interfaces/Views/capitulosDataTable.php';
?>

<script>
const ID_PRESUPUESTO_FILTRO = <?php echo $idPresupuesto; ?>;
const API_CAPITULOS = '/sgigescomnew/src/Capitulos/Interfaces/CapituloController.php';
</script>

<script src="/sgigescomnew/src/Capitulos/Interfaces/Views/capitulosDataTable.js"></script>
