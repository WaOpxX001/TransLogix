<?php
require_once '../../config.php';

// Temporarily disable auth for testing
// requireRole(['admin', 'supervisor']);
$db = new Database();
$conn = $db->getConnection();

$stmt = $conn->prepare("SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN estado = 'operativo' THEN 1 ELSE 0 END) as operational,
    SUM(CASE WHEN estado = 'mantenimiento' THEN 1 ELSE 0 END) as maintenance,
    SUM(CASE WHEN estado = 'fuera_servicio' THEN 1 ELSE 0 END) as out_of_service
    FROM vehiculos");

$stmt->execute();
$stats = $stmt->fetch();

sendResponse($stats);
?>
