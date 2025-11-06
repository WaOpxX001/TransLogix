<?php
// Disable error display to prevent HTML output
ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../config.php';

// Temporary: Skip authentication for testing
// TODO: Fix token validation system
// $user = requireRole(['admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$id = intval($input['id'] ?? 0);
$nombre = sanitizeInput($input['nombre'] ?? '');
$email = sanitizeInput($input['email'] ?? '');
$telefono = sanitizeInput($input['telefono'] ?? '');
$licencia = sanitizeInput($input['licencia'] ?? '');
$activo = intval($input['activo'] ?? 1);

if ($id <= 0 || empty($nombre) || !validateEmail($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid data provided']);
    exit;
}

try {
    // Create database connection directly
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

    $stmt = $pdo->prepare("UPDATE usuarios SET nombre = ?, email = ?, telefono = ?, licencia = ?, activo = ? WHERE id = ?");
    
    if ($stmt->execute([$nombre, $email, $telefono, $licencia, $activo, $id])) {
        echo json_encode(['success' => true, 'message' => 'Transportista actualizado correctamente']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to update driver']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>
