<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    require_once '../../config.php';
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $viaje_id = $_GET['viaje_id'] ?? null;
    
    if (!$viaje_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID de viaje requerido']);
        exit;
    }
    
    // Buscar solicitud de finalización pendiente
    $stmt = $conn->prepare("
        SELECT 
            sf.id,
            sf.estado,
            sf.fecha_solicitud,
            sf.fecha_respuesta,
            sf.motivo_rechazo,
            u.nombre as transportista_nombre
        FROM solicitudes_finalizacion sf
        LEFT JOIN usuarios u ON sf.transportista_id = u.id
        WHERE sf.viaje_id = ?
        ORDER BY sf.fecha_solicitud DESC
        LIMIT 1
    ");
    
    $stmt->execute([$viaje_id]);
    $solicitud = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($solicitud) {
        echo json_encode([
            'success' => true,
            'tiene_solicitud' => true,
            'solicitud' => $solicitud
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'tiene_solicitud' => false
        ]);
    }
    
} catch (Exception $e) {
    error_log("Error en verificar_solicitud_finalizacion.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}
?>
