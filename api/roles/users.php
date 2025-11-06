<?php
header('Content-Type: application/json');
error_reporting(0);
require_once '../../config.php';

// Temporarily disable auth for testing
// requireRole(['admin']);
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit();
}

$db = new Database();
$conn = $db->getConnection();

$stmt = $conn->prepare("SELECT id, nombre, email, telefono, rol, activo, fecha_registro, ultimo_acceso FROM usuarios ORDER BY activo DESC, nombre");
$stmt->execute();
$users = $stmt->fetchAll();

sendResponse($users);
?>
