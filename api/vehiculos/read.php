<?php
// Disable error display to prevent HTML output
ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Create database connection directly to avoid config.php headers
try {
    $pdo = new PDO(
        "mysql:host=localhost;dbname=transportepro_db;charset=utf8mb4",
        "root",
        "",
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}

try {
    // Get all vehicles with their status
    $stmt = $pdo->prepare("
        SELECT 
            v.id,
            v.placa,
            v.marca,
            v.modelo,
            v.año,
            v.tipo,
            v.estado,
            v.fecha_registro,
            t.nombre as transportista_nombre,
            t.id as transportista_id
        FROM vehiculos v
        LEFT JOIN transportistas t ON v.transportista_id = t.id
        ORDER BY v.placa ASC
    ");
    
    $stmt->execute();
    $vehiculos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the response
    foreach ($vehiculos as &$vehiculo) {
        $vehiculo['id'] = (int)$vehiculo['id'];
        $vehiculo['año'] = (int)$vehiculo['año'];
        $vehiculo['transportista_id'] = $vehiculo['transportista_id'] ? (int)$vehiculo['transportista_id'] : null;
        $vehiculo['estado'] = $vehiculo['estado'] ?: 'activo';
    }
    
    echo json_encode([
        'success' => true,
        'data' => $vehiculos,
        'message' => 'Vehículos cargados exitosamente'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al cargar vehículos: ' . $e->getMessage()
    ]);
}
?>
