<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    require_once '../../config.php';
    
    $db = new Database();
    $conn = $db->getConnection();
    
    // Obtener datos del request
    $input = json_decode(file_get_contents('php://input'), true);
    $viaje_id = $input['viaje_id'] ?? null;
    
    // Verificar autenticación
    $transportista_id = null;
    
    if (isset($_SESSION['user_id'])) {
        $transportista_id = $_SESSION['user_id'];
    } else {
        $transportista_id = $input['transportista_id'] ?? null;
    }
    
    if (!$transportista_id) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Usuario no autenticado']);
        exit;
    }
    
    if (!$viaje_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID de viaje requerido']);
        exit;
    }
    
    // Verificar que el viaje existe y está en ruta
    $stmt = $conn->prepare("SELECT id, estado, transportista_id FROM viajes WHERE id = ?");
    $stmt->execute([$viaje_id]);
    $viaje = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$viaje) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Viaje no encontrado']);
        exit;
    }
    
    if ($viaje['estado'] !== 'en_ruta') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'El viaje no está en ruta']);
        exit;
    }
    
    // Verificar que el transportista es el asignado al viaje
    if ($viaje['transportista_id'] != $transportista_id) {
        http_response_code(403);
        echo json_encode([
            'success' => false, 
            'error' => 'No tienes permiso para finalizar este viaje'
        ]);
        exit;
    }
    
    // Verificar si ya existe una solicitud de finalización pendiente
    $stmt = $conn->prepare("SELECT id FROM solicitudes_finalizacion WHERE viaje_id = ? AND estado = 'pendiente'");
    $stmt->execute([$viaje_id]);
    $solicitudExistente = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($solicitudExistente) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Ya existe una solicitud de finalización pendiente para este viaje']);
        exit;
    }
    
    // Limpiar motivo de rechazo anterior (si existe) antes de crear nueva solicitud
    $stmt = $conn->prepare("UPDATE viajes SET motivo_rechazo_finalizacion = NULL WHERE id = ?");
    $stmt->execute([$viaje_id]);
    
    // Crear la solicitud de finalización
    $stmt = $conn->prepare("
        INSERT INTO solicitudes_finalizacion (
            viaje_id, 
            transportista_id, 
            estado, 
            fecha_solicitud
        ) VALUES (?, ?, 'pendiente', NOW())
    ");
    
    $stmt->execute([$viaje_id, $transportista_id]);
    $solicitud_id = $conn->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Solicitud de finalización enviada exitosamente',
        'solicitud_id' => $solicitud_id
    ]);
    
} catch (Exception $e) {
    error_log("Error en solicitar_finalizacion.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}
?>
