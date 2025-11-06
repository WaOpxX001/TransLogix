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
function getDBConnection() {
    $db = new Database();
    return $db->getConnection();
}

// Iniciar sesión si no está iniciada
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Función helper para verificar autenticación
function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Not logged in']);
        exit();
    }
    return $_SESSION['user_id'];
}

// Función helper para obtener rol del usuario
function getUserRole() {
    return $_SESSION['user_role'] ?? null;
}
?>
