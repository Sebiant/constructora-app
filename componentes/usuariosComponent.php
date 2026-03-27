<?php
include $_SERVER['DOCUMENT_ROOT'] . '/sgigescon/src/Usuarios/Interfaces/Views/usuariosView.php';
?>

<script src="/sgigescon/src/Usuarios/Interfaces/Views/usuariosView.js"></script>

<script>
    if (typeof initUsuariosDataTable === 'function') {
        initUsuariosDataTable();
    }
</script>
