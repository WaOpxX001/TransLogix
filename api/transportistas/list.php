<?php
// Disable error display to prevent HTML output
ini_set('display_errors', 0);
error_reporting(0);

// Add debugging
error_log("Transportistas API called at " . date('Y-m-d H:i:s'));

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // Database connection
    $pdo = new PDO(
        "mysql:host=localhost;dbname=transporte_pro;charset=utf8mb4",
        "root",
        "",
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    
    session_start();
    
    // Verificar que el usuario esté logueado
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Usuario no autenticado']);
        exit;
    }
    
    // Obtener todos los transportistas (activos e inactivos)
    $sql = "SELECT id, nombre, email, telefono, licencia, rol, activo
            FROM usuarios 
            WHERE rol = 'transportista'
            ORDER BY activo DESC, nombre";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $transportistas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Agregar información adicional
    foreach ($transportistas as &$transportista) {
        $transportista['nombre_completo'] = $transportista['nombre'];
    }
    
    echo json_encode($transportistas);
    
} catch (Exception $e) {
    error_log("Error en transportistas/list.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor: ' . $e->getMessage()]);
}
?>
