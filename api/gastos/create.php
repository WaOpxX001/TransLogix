<?php
header('Content-Type: application/json');
error_reporting(0); // Suppress PHP errors for clean JSON
require_once '../../config.php';

// Get user from session
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit();
}

$user = ['user_id' => $_SESSION['user_id']];
$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

$tipo = sanitizeInput($input['tipo'] ?? '');
$fecha = sanitizeInput($input['fecha'] ?? '');
$monto = floatval($input['monto'] ?? 0);
$vehiculo_id = intval($input['vehiculo_id'] ?? 0);
$viaje_id = isset($input['viaje_id']) && $input['viaje_id'] > 0 ? intval($input['viaje_id']) : null;
$kilometraje = intval($input['kilometraje'] ?? 0);
$litros = floatval($input['litros'] ?? 0);
$numero_factura = sanitizeInput($input['numero_factura'] ?? '');
$descripcion = sanitizeInput($input['descripcion'] ?? '');

if (empty($tipo) || empty($fecha) || $monto <= 0 || $vehiculo_id <= 0) {
    sendError('Missing required fields');
}

// Verificar si la columna viaje_id existe en la tabla
$checkColumn = $conn->query("SHOW COLUMNS FROM gastos LIKE 'viaje_id'");
$viajeIdExists = $checkColumn->rowCount() > 0;

if ($viajeIdExists && $viaje_id !== null) {
    // Si la columna existe y hay un viaje_id, incluirlo en el INSERT
    $stmt = $conn->prepare("INSERT INTO gastos (usuario_id, tipo, fecha, monto, vehiculo_id, viaje_id, kilometraje, litros, numero_factura, descripcion, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')");
    $success = $stmt->execute([$user['user_id'], $tipo, $fecha, $monto, $vehiculo_id, $viaje_id, $kilometraje, $litros, $numero_factura, $descripcion]);
} else {
    // Si la columna no existe o no hay viaje_id, usar el INSERT original
    $stmt = $conn->prepare("INSERT INTO gastos (usuario_id, tipo, fecha, monto, vehiculo_id, kilometraje, litros, numero_factura, descripcion, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')");
    $success = $stmt->execute([$user['user_id'], $tipo, $fecha, $monto, $vehiculo_id, $kilometraje, $litros, $numero_factura, $descripcion]);
}

if ($success) {
    sendResponse(['success' => true, 'id' => $conn->lastInsertId()]);
} else {
    sendError('Failed to create expense');
}
?>
