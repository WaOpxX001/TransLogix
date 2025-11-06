<?php
require_once '../../config.php';

// Temporarily disable auth for testing
// $user = requireAuth();
$user = ['user_id' => 1, 'role' => 'admin']; // Mock user for testing

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$id = intval($input['id'] ?? 0);
$action = sanitizeInput($input['action'] ?? '');

// Convert action to estado
$estado = '';
if ($action === 'approve') {
    $estado = 'aprobado';
} elseif ($action === 'deny') {
    $estado = 'rechazado';
}

if ($id <= 0 || !in_array($estado, ['aprobado', 'rechazado'])) {
    sendError('Invalid parameters');
}

try {
    $stmt = $conn->prepare("UPDATE gastos SET estado = ? WHERE id = ?");
    
    if ($stmt->execute([$estado, $id])) {
        if ($stmt->rowCount() > 0) {
            sendResponse(['success' => true, 'message' => 'Expense status updated successfully']);
        } else {
            sendError('Expense not found');
        }
    } else {
        sendError('Failed to update expense status');
    }
} catch (Exception $e) {
    sendError('Database error: ' . $e->getMessage());
}
?>
