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

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

$id = intval($input['id'] ?? 0);
$rol = sanitizeInput($input['rol'] ?? '');
$activo = intval($input['activo'] ?? 1);

if ($id <= 0 || empty($rol)) {
    sendError('Invalid data');
}

$stmt = $conn->prepare("UPDATE usuarios SET rol = ?, activo = ? WHERE id = ?");
if ($stmt->execute([$rol, $activo, $id])) {
    sendResponse(['success' => true]);
} else {
    sendError('Failed to update user role');
}
?>
