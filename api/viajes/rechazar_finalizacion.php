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
    $motivo = $input['motivo'] ?? '';
    
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
        echo json_encode(['success' => false, 'error' => 'No tienes permisos para rechazar finalizaciones']);
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
    
    // Buscar la solicitud de finalización pendiente
    $stmt = $conn->prepare("
        SELECT id, transportista_id, estado
        FROM solicitudes_finalizacion
        WHERE viaje_id = ?
        ORDER BY fecha_solicitud DESC
        LIMIT 1
    ");
    $stmt->execute([$viaje_id]);
    $solicitud = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$solicitud) {
        // No hay ninguna solicitud, verificar estado del viaje
        $stmt = $conn->prepare("SELECT estado FROM viajes WHERE id = ?");
        $stmt->execute([$viaje_id]);
        $viaje = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($viaje && $viaje['estado'] === 'en_ruta') {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'error' => 'No hay solicitud de finalización pendiente. El transportista debe solicitar primero.',
                'ya_procesado' => true
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false, 
                'error' => 'No se encontró el viaje o ya no está en ruta',
                'ya_procesado' => true
            ]);
        }
        exit;
    }
    
    // Verificar que la solicitud esté pendiente
    if ($solicitud['estado'] !== 'pendiente') {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'error' => 'Esta solicitud ya fue procesada anteriormente',
            'ya_procesado' => true
        ]);
        exit;
    }
    
    // Iniciar transacción
    $conn->beginTransaction();
    
    try {
        // Actualizar la solicitud con el motivo del rechazo
        $stmt = $conn->prepare("
            UPDATE solicitudes_finalizacion 
            SET estado = 'rechazada', 
                fecha_respuesta = NOW(),
                aprobado_por = ?,
                motivo_rechazo = ?
            WHERE id = ?
        ");
        
        $resultado = $stmt->execute([$admin_id, $motivo, $solicitud['id']]);
        
        if (!$resultado || $stmt->rowCount() === 0) {
            throw new Exception('No se pudo actualizar la solicitud en la base de datos');
        }
        
        // Guardar el motivo en el viaje para que se pueda ver en detalles
        $stmt = $conn->prepare("
            UPDATE viajes 
            SET motivo_rechazo_finalizacion = ?
            WHERE id = ?
        ");
        $stmt->execute([$motivo, $viaje_id]);
        
        // IMPORTANTE: Eliminar la solicitud rechazada para que el transportista pueda volver a solicitar
        // Esto permite que el botón "Terminar Viaje" vuelva a aparecer
        $stmt = $conn->prepare("DELETE FROM solicitudes_finalizacion WHERE id = ?");
        $stmt->execute([$solicitud['id']]);
        
        // Commit de la transacción
        $conn->commit();
        
        error_log("RECHAZO FINALIZACIÓN EXITOSO: Solicitud {$solicitud['id']}, Viaje {$viaje_id}, Motivo: {$motivo}");
        
        echo json_encode([
            'success' => true,
            'message' => 'Solicitud de finalización rechazada. El viaje continúa en ruta y el transportista puede volver a solicitar.',
            'solicitud_id' => $solicitud['id'],
            'motivo' => $motivo
        ]);
        
    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Error en rechazar_finalizacion.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}
?>
