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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

// Log del input recibido
error_log("RESET PASSWORD - Raw input: " . $rawInput);
error_log("RESET PASSWORD - Parsed input: " . json_encode($input));

$id = intval($input['id'] ?? 0);
$password = $input['password'] ?? '';

error_log("RESET PASSWORD - User ID: " . $id);
error_log("RESET PASSWORD - Password: " . $password);
error_log("RESET PASSWORD - Password length: " . strlen($password));

if ($id <= 0) {
    error_log("RESET PASSWORD - ERROR: Invalid ID");
    sendError('Invalid ID');
}

// Validar que la contraseña no esté vacía
if (empty($password)) {
    error_log("RESET PASSWORD - ERROR: Empty password");
    sendError('Password cannot be empty');
}

// NO hashear la contraseña - guardar en texto plano para compatibilidad
// El sistema actual usa texto plano
$stmt = $conn->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
if ($stmt->execute([$password, $id])) {
    error_log("RESET PASSWORD - Success for user ID: " . $id);
    
    // Verificar que se guardó correctamente
    $verifyStmt = $conn->prepare("SELECT password FROM usuarios WHERE id = ?");
    $verifyStmt->execute([$id]);
    $savedPassword = $verifyStmt->fetchColumn();
    
    error_log("RESET PASSWORD - Saved password: " . $savedPassword);
    error_log("RESET PASSWORD - Match: " . ($savedPassword === $password ? 'YES' : 'NO'));
    
    sendResponse([
        'success' => true,
        'message' => 'Password updated successfully',
        'debug' => [
            'id' => $id,
            'password_length' => strlen($password),
            'saved_correctly' => ($savedPassword === $password)
        ]
    ]);
} else {
    error_log("RESET PASSWORD - Failed for user ID: " . $id);
    error_log("RESET PASSWORD - Error: " . json_encode($stmt->errorInfo()));
    sendError('Failed to reset password: ' . json_encode($stmt->errorInfo()));
}
?>
