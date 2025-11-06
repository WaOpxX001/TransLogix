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
    
    // La sesión ya se inicia en config.php
    
    // Obtener datos del request primero
    $input = json_decode(file_get_contents('php://input'), true);
    $viaje_id = $input['viaje_id'] ?? null;
    $motivo = $input['motivo'] ?? '';
    $dias_bloqueo = $input['dias_bloqueo'] ?? 10; // Por defecto 10 días
    
    // Verificar autenticación - Soportar modo de prueba
    $admin_id = null;
    $user_role = '';
    
    if (isset($_SESSION['user_id'])) {
        // Usuario autenticado con sesión PHP
        $admin_id = $_SESSION['user_id'];
        $user_role = $_SESSION['user_role'] ?? $_SESSION['role'] ?? '';
    } else {
        // Fallback: Obtener del request (para modo de prueba)
        $admin_id = $input['admin_id'] ?? 1; // ID por defecto para modo de prueba
        $user_role = 'admin'; // Asumir admin en modo de prueba
    }
    
    // Verificar que sea admin o supervisor (solo si hay sesión real)
    if (isset($_SESSION['user_id']) && !in_array(strtolower($user_role), ['admin', 'administrador', 'supervisor'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No tienes permisos para rechazar solicitudes']);
        exit;
    }
    
    if (!$viaje_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID de viaje requerido']);
        exit;
    }
    
    if (empty($motivo)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'El motivo del rechazo es requerido']);
        exit;
    }
    
    // Buscar la solicitud pendiente
    $stmt = $conn->prepare("
        SELECT id, transportista_id
        FROM solicitudes_viajes
        WHERE viaje_id = ? AND estado = 'pendiente'
        LIMIT 1
    ");
    $stmt->execute([$viaje_id]);
    $solicitud = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$solicitud) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'No se encontró solicitud pendiente para este viaje']);
        exit;
    }
    
    // Calcular fecha de desbloqueo
    $fecha_desbloqueo = date('Y-m-d H:i:s', strtotime("+{$dias_bloqueo} days"));
    
    // Actualizar la solicitud (usar 'denegada' que es el valor correcto del ENUM)
    $stmt = $conn->prepare("
        UPDATE solicitudes_viajes 
        SET estado = 'denegada', 
            fecha_respuesta = NOW(),
            aprobado_por = ?,
            motivo_denegacion = ?,
            dias_bloqueo = ?,
            fecha_desbloqueo = ?
        WHERE id = ?
    ");
    
    $resultado = $stmt->execute([$admin_id, $motivo, $dias_bloqueo, $fecha_desbloqueo, $solicitud['id']]);
    
    // Verificar que se actualizó
    if (!$resultado || $stmt->rowCount() === 0) {
        error_log("ERROR: No se pudo actualizar la solicitud ID: {$solicitud['id']}");
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'No se pudo actualizar la solicitud en la base de datos'
        ]);
        exit;
    }
    
    // Log para debugging
    error_log("RECHAZO EXITOSO: Solicitud {$solicitud['id']}, Viaje {$viaje_id}, Transportista {$solicitud['transportista_id']}, Días: {$dias_bloqueo}");
    
    $mensaje_dias = $dias_bloqueo == 1 ? '1 día' : "{$dias_bloqueo} días";
    
    echo json_encode([
        'success' => true,
        'message' => "Solicitud rechazada. El transportista no podrá solicitar este viaje por {$mensaje_dias}.",
        'dias_bloqueo' => $dias_bloqueo,
        'fecha_desbloqueo' => $fecha_desbloqueo,
        'solicitud_id' => $solicitud['id'],
        'transportista_id' => $solicitud['transportista_id']
    ]);
    
} catch (Exception $e) {
    error_log("Error en rechazar_inicio.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}
?>
