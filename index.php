<?php
/**
 * SGI - Sistema de Gestión Integral
 * Main Entry Point
 */

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include the layout
include $_SERVER['DOCUMENT_ROOT'] . '/sgigescon/src/Layout/Interfaces/Views/layoutView.php';
?>
