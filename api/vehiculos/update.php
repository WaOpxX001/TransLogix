<?php
require_once '../../config.php';

// Temporarily disable auth for testing
// requireRole(['admin']);
$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendError('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

$id = intval($input['id'] ?? 0);
$placa = sanitizeInput($input['placa'] ?? '');
$tipo = sanitizeInput($input['tipo'] ?? '');
$marca = sanitizeInput($input['marca'] ?? '');
$modelo = sanitizeInput($input['modelo'] ?? '');
$año = intval($input['año'] ?? 0);
$kilometraje = intval($input['kilometraje'] ?? 0);
$estado = sanitizeInput($input['estado'] ?? '');

if ($id <= 0 || empty($placa) || empty($estado)) {
    sendError('Invalid data');
}

$stmt = $conn->prepare("UPDATE vehiculos SET placa = ?, tipo = ?, marca = ?, modelo = ?, año = ?, kilometraje = ?, estado = ? WHERE id = ?");
if ($stmt->execute([$placa, $tipo, $marca, $modelo, $año, $kilometraje, $estado, $id])) {
    sendResponse(['success' => true]);
} else {
    sendError('Failed to update vehicle');
}
?>
