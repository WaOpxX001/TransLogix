<?php
/**
 * Database Helper
 * Incluir este archivo en lugar de crear conexiones manuales
 * Detecta automáticamente Railway o local
 */

// Incluir config.php si no está incluido
if (!class_exists('Database')) {
    require_once __DIR__ . '/../config.php';
}

// Función helper para obtener conexión PDO
if (!function_exists('getDBConnection')) {
    function getDBConnection() {
        $db = new Database();
        return $db->getConnection();
    }
}

// La sesión se inicia automáticamente en Database::__construct()
// Las funciones requireAuth() y getUserRole() están definidas en config.php
// No las redeclaramos aquí para evitar errores
?>
