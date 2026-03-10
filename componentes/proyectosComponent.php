<?php
include $_SERVER['DOCUMENT_ROOT'] . '/sgigescon/src/Proyectos/Interfaces/Views/proyectosView.php';
?>

<script src="/sgigescon/src/Proyectos/Interfaces/Views/proyectosView.js"></script>
<script src="/sgigescon/src/Proyectos/Interfaces/Views/proyectosInspection.js"></script>

<script>
    // Inicializar explícitamente después de que se hayan cargado los scripts
    if (typeof initProyectosDataTable === 'function') {
        initProyectosDataTable();
    }
</script>

<style>
.btn-inspeccionar {
    margin-right: 0.25rem;
    margin-bottom: 0.25rem;
}
</style>
