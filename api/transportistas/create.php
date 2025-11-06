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

$nombre = sanitizeInput($input['nombre'] ?? '');
$email = sanitizeInput($input['email'] ?? '');
$telefono = sanitizeInput($input['telefono'] ?? '');
$licencia = sanitizeInput($input['licencia'] ?? '');
$password = $input['password'] ?? '12345'; // Default password

if (empty($nombre) || !validateEmail($email) || empty($telefono) || empty($licencia)) {
    sendError('Missing required fields');
}

// Check if email exists
$stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    sendError('Email already exists');
}

try {
    $hashedPassword = hashPassword($password);
    $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, telefono, licencia, password, rol, activo, fecha_registro) VALUES (?, ?, ?, ?, ?, 'transportista', 1, NOW())");

    if ($stmt->execute([$nombre, $email, $telefono, $licencia, $hashedPassword])) {
        sendResponse(['success' => true, 'id' => $conn->lastInsertId()]);
    } else {
        sendError('Failed to create driver');
    }
} catch (Exception $e) {
    sendError('Database error: ' . $e->getMessage());
}
?>
