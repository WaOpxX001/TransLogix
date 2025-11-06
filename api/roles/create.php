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
$rol = sanitizeInput($input['rol'] ?? 'transportista');
$password = $input['password'] ?? '12345';

if (empty($nombre) || empty($email) || !validateEmail($email)) {
    sendError('Missing or invalid required fields');
}

try {
    // Check if email already exists
    $checkStmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
    $checkStmt->execute([$email]);
    if ($checkStmt->fetch()) {
        sendError('Email already exists');
    }

    $hashedPassword = hashPassword($password);
    
    $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, password, rol, activo, fecha_registro) VALUES (?, ?, ?, ?, 1, NOW())");
    
    if ($stmt->execute([$nombre, $email, $hashedPassword, $rol])) {
        sendResponse(['success' => true, 'id' => $conn->lastInsertId()]);
    } else {
        sendError('Failed to create user');
    }
} catch (Exception $e) {
    sendError('Database error: ' . $e->getMessage());
}
?>
