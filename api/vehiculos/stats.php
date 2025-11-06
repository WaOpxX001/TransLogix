<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../config.php';

// Temporarily disable auth for testing
// requireRole(['admin', 'supervisor']);
$db = new Database();
$conn = $db->getConnection();

$stmt = $conn->prepare("SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN LOWER(estado) LIKE '%operaci%' OR LOWER(estado) = 'operativo' OR LOWER(estado) = 'disponible' THEN 1 ELSE 0 END) as operational,
    SUM(CASE WHEN LOWER(estado) LIKE '%mantenimiento%' THEN 1 ELSE 0 END) as maintenance,
    SUM(CASE WHEN LOWER(estado) LIKE '%fuera%' OR LOWER(estado) = 'fuera_servicio' THEN 1 ELSE 0 END) as out_of_service
    FROM vehiculos");

$stmt->execute();
$stats = $stmt->fetch();

sendResponse($stats);
?>
