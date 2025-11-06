<?php
require_once '../../config.php';

// Temporarily disable auth for testing
// requireRole(['admin']);
$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

$placa = sanitizeInput($input['placa'] ?? '');
$tipo = sanitizeInput($input['tipo'] ?? '');
$marca = sanitizeInput($input['marca'] ?? '');
$modelo = sanitizeInput($input['modelo'] ?? '');
$año = intval($input['año'] ?? 0);
$kilometraje = intval($input['kilometraje'] ?? 0);
$estado = sanitizeInput($input['estado'] ?? 'operativo');

if (empty($placa) || empty($tipo) || empty($marca) || empty($modelo) || $año <= 0) {
    sendError('Missing required fields');
}

try {
    // Check if plate already exists
    $checkStmt = $conn->prepare("SELECT id FROM vehiculos WHERE placa = ?");
    $checkStmt->execute([$placa]);
    if ($checkStmt->fetch()) {
        sendError('La placa ' . $placa . ' ya existe. Por favor usa una placa diferente.');
    }

    $stmt = $conn->prepare("INSERT INTO vehiculos (placa, tipo, marca, modelo, año, kilometraje, estado) VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    if ($stmt->execute([$placa, $tipo, $marca, $modelo, $año, $kilometraje, $estado])) {
        sendResponse(['success' => true, 'id' => $conn->lastInsertId()]);
    } else {
        sendError('Failed to create vehicle');
    }
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
        sendError('La placa ' . $placa . ' ya existe. Por favor usa una placa diferente.');
    } else {
        sendError('Database error: ' . $e->getMessage());
    }
}
?>
