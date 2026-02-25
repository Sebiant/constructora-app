<?php
define('IS_COMPONENT', true);

// Render Budget CRUD first
include $_SERVER['DOCUMENT_ROOT'] . '/sgigescomnew/src/Presupuesto/Interfaces/Views/presupuestoView.php';
?>

<script src="/sgigescomnew/src/Presupuesto/Interfaces/Views/presupuestoView.js?v=<?php echo time(); ?>"></script>

<hr class="my-5 border-2 opacity-25">

<?php
// Render Import Masiva second
include $_SERVER['DOCUMENT_ROOT'] . '/sgigescomnew/src/Presupuesto/Interfaces/Views/masiveImportBtn.php';
?>

<!-- Project Lock Script -->
<script src="/sgigescomnew/src/Shared/Scripts/projectLock.js"></script>

<script>
    // Initialize Budget CRUD if function is available
    $(document).ready(function() {
        if (typeof initPresupuestoCRUD === 'function') {
            initPresupuestoCRUD();
        }
    });
</script>
