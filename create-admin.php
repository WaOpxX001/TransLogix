<?php
/**
 * Crear usuario administrador
 * IMPORTANTE: Elimina este archivo después de usarlo por seguridad
 */

header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

// Credenciales del admin
$adminEmail = 'admin@translogix.com';
$adminPassword = 'admin123'; // CÁMBIALO después del primer login
$adminNombre = 'Administrador';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Verificar si ya existe el usuario
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$adminEmail]);
    $existing = $stmt->fetch();
    
    if ($existing) {
        echo json_encode([
            'status' => 'info',
            'message' => 'Admin user already exists',
            'email' => $adminEmail,
            'note' => 'Use this email to login'
        ], JSON_PRETTY_PRINT);
        exit;
    }
    
    // Crear el usuario administrador
    $hashedPassword = password_hash($adminPassword, PASSWORD_DEFAULT);
    
    $stmt = $conn->prepare("
        INSERT INTO usuarios (nombre, email, password, rol, activo, created_at) 
        VALUES (?, ?, ?, 'administrador', 1, NOW())
    ");
    
    $stmt->execute([$adminNombre, $adminEmail, $hashedPassword]);
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Admin user created successfully',
        'credentials' => [
            'email' => $adminEmail,
            'password' => $adminPassword
        ],
        'warning' => 'DELETE THIS FILE (create-admin.php) AFTER FIRST LOGIN FOR SECURITY!',
        'next_steps' => [
            '1. Login with the credentials above',
            '2. Change your password immediately',
            '3. Delete this file from your server'
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'details' => $e->getTrace()
    ], JSON_PRETTY_PRINT);
}
?>
