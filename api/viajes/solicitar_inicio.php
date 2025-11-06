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
    
    // La sesión ya se inicia en config.php, no es necesario iniciarla de nuevo
    
    // Obtener datos del request
    $input = json_decode(file_get_contents('php://input'), true);
    $viaje_id = $input['viaje_id'] ?? null;
    
    // Verificar autenticación - Soportar tanto sesión PHP como datos del request
    $transportista_id = null;
    
    if (isset($_SESSION['user_id'])) {
        // Usuario autenticado con sesión PHP
        $transportista_id = $_SESSION['user_id'];
    } else {
        // Fallback: Obtener del request (para modo de prueba)
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
    
    // Verificar que el viaje existe y está pendiente
    $stmt = $conn->prepare("SELECT id, estado, transportista_id FROM viajes WHERE id = ?");
    $stmt->execute([$viaje_id]);
    $viaje = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$viaje) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Viaje no encontrado']);
        exit;
    }
    
    if ($viaje['estado'] !== 'pendiente') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'El viaje no está en estado pendiente']);
        exit;
    }
    
    // Verificar que el transportista es el asignado al viaje
    // NOTA: En modo de prueba, permitir si el transportista_id del viaje es NULL o coincide
    if ($viaje['transportista_id'] != null && $viaje['transportista_id'] != $transportista_id) {
        http_response_code(403);
        echo json_encode([
            'success' => false, 
            'error' => 'No tienes permiso para solicitar este viaje. Este viaje está asignado a otro transportista.'
        ]);
        exit;
    }
    
    // Verificar que no tenga otro viaje activo (en_ruta)
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM viajes WHERE transportista_id = ? AND estado = 'en_ruta'");
    $stmt->execute([$transportista_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['count'] > 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'error' => 'Ya tienes un viaje activo. Debes completarlo antes de iniciar otro.'
        ]);
        exit;
    }
    
    // Verificar si ya existe una solicitud pendiente para este viaje
    $stmt = $conn->prepare("SELECT id FROM solicitudes_viajes WHERE viaje_id = ? AND estado = 'pendiente'");
    $stmt->execute([$viaje_id]);
    $solicitudExistente = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($solicitudExistente) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Ya existe una solicitud pendiente para este viaje']);
        exit;
    }
    
    // Verificar si el viaje fue rechazado y aún está bloqueado (usar 'denegada')
    $stmt = $conn->prepare("
        SELECT fecha_respuesta, dias_bloqueo, fecha_desbloqueo, motivo_denegacion
        FROM solicitudes_viajes 
        WHERE viaje_id = ? 
        AND transportista_id = ? 
        AND estado = 'denegada' 
        AND (fecha_desbloqueo IS NULL OR fecha_desbloqueo > NOW())
        ORDER BY fecha_respuesta DESC 
        LIMIT 1
    ");
    $stmt->execute([$viaje_id, $transportista_id]);
    $rechazo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($rechazo) {
        // Calcular días restantes
        $fecha_actual = new DateTime();
        $fecha_desbloqueo = new DateTime($rechazo['fecha_desbloqueo']);
        $dias_restantes = $fecha_actual->diff($fecha_desbloqueo)->days + 1;
        
        if ($dias_restantes < 0) {
            $dias_restantes = 0;
        }
        
        $mensaje_dias = $dias_restantes == 1 ? '1 día' : "{$dias_restantes} días";
        
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'error' => "Este viaje fue rechazado recientemente. Podrás solicitarlo nuevamente en {$mensaje_dias}.",
            'bloqueado' => true,
            'dias_restantes' => $dias_restantes,
            'fecha_desbloqueo' => $rechazo['fecha_desbloqueo'],
            'motivo_rechazo' => $rechazo['motivo_denegacion']
        ]);
        exit;
    }
    
    // Crear la solicitud
    $stmt = $conn->prepare("
        INSERT INTO solicitudes_viajes (
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
        'message' => 'Solicitud enviada exitosamente',
        'solicitud_id' => $solicitud_id
    ]);
    
} catch (Exception $e) {
    error_log("Error en solicitar_inicio.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}
?>
