<?php
// Disable error display to prevent HTML output
ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../config.php';

// Temporary: Skip authentication for testing
// TODO: Fix token validation system
// $user = requireRole(['admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$id = intval($input['id'] ?? 0);

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid ID']);
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

    // Check if vehicle exists first
    $checkStmt = $pdo->prepare("SELECT id, placa FROM vehiculos WHERE id = ?");
    $checkStmt->execute([$id]);
    $vehicle = $checkStmt->fetch();
    
    if (!$vehicle) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Vehicle not found']);
        exit;
    }

    // Use hard delete since activo column doesn't exist
    $stmt = $pdo->prepare("DELETE FROM vehiculos WHERE id = ?");
    $result = $stmt->execute([$id]);
    $rowsAffected = $stmt->rowCount();
    
    if ($result && $rowsAffected > 0) {
        echo json_encode([
            'success' => true, 
            'message' => 'Vehículo eliminado correctamente',
            'debug' => [
                'id' => $id,
                'rows_affected' => $rowsAffected,
                'vehicle_before' => $vehicle
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'error' => 'Failed to delete vehicle',
            'debug' => [
                'id' => $id,
                'rows_affected' => $rowsAffected,
                'vehicle_found' => $vehicle
            ]
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>
