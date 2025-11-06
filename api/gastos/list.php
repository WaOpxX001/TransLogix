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

$user = [
    'user_id' => $_SESSION['user_id'],
    'role' => $_SESSION['user_role']
];
$db = new Database();
$conn = $db->getConnection();

$query = "SELECT g.*, u.nombre as usuario_nombre, v.placa as vehiculo_placa, v.marca, v.modelo 
         FROM gastos g 
         LEFT JOIN usuarios u ON g.usuario_id = u.id 
         LEFT JOIN vehiculos v ON g.vehiculo_id = v.id";

$params = [];
if ($user['role'] === 'transportista') {
    $query .= " WHERE g.usuario_id = ?";
    $params[] = $user['user_id'];
}

$query .= " ORDER BY g.fecha DESC";

$stmt = $conn->prepare($query);
$stmt->execute($params);
$expenses = $stmt->fetchAll();

sendResponse($expenses);
?>
