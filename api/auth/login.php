<?php
require_once '../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$email = sanitizeInput($input['email'] ?? '');
$password = $input['password'] ?? '';

// Debug logging
error_log("LOGIN DEBUG - Input: " . json_encode($input));
error_log("LOGIN DEBUG - Email: " . $email);
error_log("LOGIN DEBUG - Password length: " . strlen($password));

if (!validateEmail($email) || empty($password)) {
    error_log("LOGIN DEBUG - Validation failed - Email valid: " . (validateEmail($email) ? 'yes' : 'no') . ", Password empty: " . (empty($password) ? 'yes' : 'no'));
    sendError('Invalid credentials');
}

$db = new Database();
$conn = $db->getConnection();

// Query user from database - get role from database, don't require it from frontend
$stmt = $conn->prepare("SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ? AND activo = 1");
$stmt->execute([$email]);
$user = $stmt->fetch();

error_log("LOGIN DEBUG - User found: " . ($user ? 'yes' : 'no'));
if ($user) {
    error_log("LOGIN DEBUG - User data: " . json_encode([
        'id' => $user['id'],
        'nombre' => $user['nombre'],
        'email' => $user['email'],
        'rol' => $user['rol'],
        'password_length' => strlen($user['password'])
    ]));
}

if (!$user) {
    error_log("LOGIN DEBUG - No user found with email: " . $email);
    sendError('Invalid credentials');
}

// For existing system compatibility - check plain text password first, then hash
$passwordValid = ($password === $user['password']) || verifyPassword($password, $user['password']);

error_log("LOGIN DEBUG - Password check - Plain match: " . ($password === $user['password'] ? 'yes' : 'no'));
error_log("LOGIN DEBUG - Password check - Hash match: " . (verifyPassword($password, $user['password']) ? 'yes' : 'no'));
error_log("LOGIN DEBUG - Password valid: " . ($passwordValid ? 'yes' : 'no'));

if (!$passwordValid) {
    error_log("LOGIN DEBUG - Password validation failed for user: " . $user['email']);
    sendError('Invalid credentials');
}

// Actualizar último acceso
$updateStmt = $conn->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?");
$updateStmt->execute([$user['id']]);

// Generate token
$token = generateToken($user['id'], $user['rol']);
$_SESSION['auth_token'] = $token;
$_SESSION['user_id'] = $user['id'];
$_SESSION['user_role'] = $user['rol'];

sendResponse([
    'success' => true,
    'token' => $token,
    'user' => [
        'id' => $user['id'],
        'name' => $user['nombre'],
        'email' => $user['email'],
        'role' => $user['rol']
    ]
]);
?>
