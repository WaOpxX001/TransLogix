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
    
    // Verificar autenticación
    $admin_id = null;
    $user_role = '';
    
    if (isset($_SESSION['user_id'])) {
        $admin_id = $_SESSION['user_id'];
        $user_role = $_SESSION['user_role'] ?? $_SESSION['role'] ?? '';
    } else {
        $admin_id = $input['admin_id'] ?? 1;
        $user_role = 'admin';
    }
    
    // Verificar que sea admin o supervisor
    if (isset($_SESSION['user_id']) && !in_array(strtolower($user_role), ['admin', 'administrador', 'supervisor'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No tienes permisos para aprobar finalizaciones']);
        exit;
    }
    
    // Obtener ID del viaje
    $viaje_id = $input['viaje_id'] ?? null;
    
    if (!$viaje_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID de viaje requerido']);
        exit;
    }
    
    // Buscar la solicitud de finalización pendiente
    $stmt = $conn->prepare("
        SELECT s.id, s.transportista_id, s.estado as solicitud_estado, v.estado as viaje_estado
        FROM solicitudes_finalizacion s
        JOIN viajes v ON s.viaje_id = v.id
        WHERE s.viaje_id = ?
        ORDER BY s.fecha_solicitud DESC
        LIMIT 1
    ");
    $stmt->execute([$viaje_id]);
    $solicitud = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$solicitud) {
        // No hay ninguna solicitud
        $stmt = $conn->prepare("SELECT estado FROM viajes WHERE id = ?");
        $stmt->execute([$viaje_id]);
        $viaje = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($viaje && $viaje['estado'] === 'completado') {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'error' => 'Este viaje ya fue completado',
                'ya_procesado' => true
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false, 
                'error' => 'No hay solicitud de finalización pendiente',
                'ya_procesado' => true
            ]);
        }
        exit;
    }
    
    // Verificar que la solicitud esté pendiente
    if ($solicitud['solicitud_estado'] !== 'pendiente') {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'error' => 'Esta solicitud ya fue procesada anteriormente',
            'ya_procesado' => true
        ]);
        exit;
    }
    
    // Verificar que el viaje esté en ruta
    if ($solicitud['viaje_estado'] !== 'en_ruta') {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'error' => 'El viaje no está en ruta',
            'ya_procesado' => true
        ]);
        exit;
    }
    
    // Iniciar transacción
    $conn->beginTransaction();
    
    try {
        // Actualizar la solicitud
        $stmt = $conn->prepare("
            UPDATE solicitudes_finalizacion 
            SET estado = 'aprobada', 
                fecha_respuesta = NOW(),
                aprobado_por = ?
            WHERE id = ?
        ");
        $stmt->execute([$admin_id, $solicitud['id']]);
        
        // Cambiar el estado del viaje a "completado" y limpiar motivo de rechazo anterior
        $stmt = $conn->prepare("
            UPDATE viajes 
            SET estado = 'completado',
                motivo_rechazo_finalizacion = NULL
            WHERE id = ?
        ");
        $stmt->execute([$viaje_id]);
        
        // Commit de la transacción
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Viaje finalizado exitosamente'
        ]);
        
    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Error en aprobar_finalizacion.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}
?>
