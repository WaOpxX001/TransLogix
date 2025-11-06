<?php
/**
 * Check Authentication Status
 * Verifica si el usuario está autenticado
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Iniciar sesión si no está activa
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

try {
    // Log para debugging
    error_log("Auth Check - Session ID: " . session_id());
    error_log("Auth Check - Session data: " . json_encode($_SESSION));
    
    // Verificar si hay sesión activa
    if (isset($_SESSION['user_id']) && !empty($_SESSION['user_id'])) {
        // Usuario autenticado
        $response = [
            'authenticated' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'nombre' => $_SESSION['user_nombre'] ?? '',
                'email' => $_SESSION['user_email'] ?? '',
                'rol' => $_SESSION['user_role'] ?? 'usuario',
                'permisos' => $_SESSION['user_permissions'] ?? []
            ],
            'session_id' => session_id()
        ];
        
        error_log("Auth Check - User authenticated: " . $_SESSION['user_id']);
        echo json_encode($response);
        
    } else {
        // No autenticado
        error_log("Auth Check - No authenticated session found");
        echo json_encode([
            'authenticated' => false,
            'message' => 'No authenticated session found',
            'session_id' => session_id()
        ]);
    }
} catch (Exception $e) {
    error_log("Auth Check Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Error checking authentication',
        'message' => $e->getMessage()
    ]);
}
?>
