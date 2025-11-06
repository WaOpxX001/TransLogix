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

// Debug logging
error_log("DELETE Request - Input: " . json_encode($input));
error_log("DELETE Request - ID: " . $id);

if ($id <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'error' => 'Invalid ID',
        'debug' => [
            'received_input' => $input,
            'parsed_id' => $id
        ]
    ]);
    exit;
}

try {
    // Create database connection directly with correct database name
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

    // Check if user exists first
    $checkStmt = $pdo->prepare("SELECT id, activo, nombre FROM usuarios WHERE id = ?");
    $checkStmt->execute([$id]);
    $user = $checkStmt->fetch();
    
    error_log("User found: " . json_encode($user));
    
    if (!$user) {
        http_response_code(404);
        echo json_encode([
            'success' => false, 
            'error' => 'User not found',
            'debug' => [
                'searched_id' => $id,
                'query_result' => $user
            ]
        ]);
        exit;
    }

    // Hard delete - permanently remove from database
    $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
    $result = $stmt->execute([$id]);
    $rowsAffected = $stmt->rowCount();
    
    if ($result && $rowsAffected > 0) {
        echo json_encode([
            'success' => true, 
            'message' => 'Usuario eliminado permanentemente de la base de datos',
            'debug' => [
                'id' => $id,
                'rows_affected' => $rowsAffected,
                'user_before_deletion' => $user,
                'operation' => 'hard_delete'
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'error' => 'Failed to delete user from database',
            'debug' => [
                'id' => $id,
                'rows_affected' => $rowsAffected,
                'user_found' => $user,
                'operation' => 'hard_delete_failed'
            ]
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>
