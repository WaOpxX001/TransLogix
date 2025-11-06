<?php
/**
 * Verificar usuarios en la base de datos
 */

header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Contar usuarios
    $count = $conn->query("SELECT COUNT(*) as total FROM usuarios")->fetch();
    
    // Listar usuarios (sin mostrar passwords)
    $users = $conn->query("SELECT id, nombre, email, rol, activo, created_at FROM usuarios")->fetchAll();
    
    echo json_encode([
        'status' => 'success',
        'total_users' => $count['total'],
        'users' => $users,
        'message' => $count['total'] > 0 ? 'Users found' : 'No users in database - you need to create one'
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
