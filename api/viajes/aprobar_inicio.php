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
        echo json_encode(['success' => false, 'error' => 'No tienes permisos para aprobar solicitudes']);
        exit;
    }
    
    // Obtener ID del viaje
    $viaje_id = $input['viaje_id'] ?? null;
    
    if (!$viaje_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID de viaje requerido']);
        exit;
    }
    
    // Buscar la solicitud pendiente
    $stmt = $conn->prepare("
        SELECT s.id, s.transportista_id, v.estado as viaje_estado
        FROM solicitudes_viajes s
        JOIN viajes v ON s.viaje_id = v.id
        WHERE s.viaje_id = ? AND s.estado = 'pendiente'
        LIMIT 1
    ");
    $stmt->execute([$viaje_id]);
    $solicitud = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$solicitud) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'No se encontró solicitud pendiente para este viaje']);
        exit;
    }
    
    // Verificar que el viaje esté en estado pendiente
    if ($solicitud['viaje_estado'] !== 'pendiente') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'El viaje no está en estado pendiente']);
        exit;
    }
    
    // Verificar que el transportista no tenga otro viaje activo
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM viajes WHERE transportista_id = ? AND estado = 'en_ruta'");
    $stmt->execute([$solicitud['transportista_id']]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['count'] > 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'error' => 'El transportista ya tiene un viaje activo'
        ]);
        exit;
    }
    
    // Iniciar transacción
    $conn->beginTransaction();
    
    try {
        // Actualizar la solicitud
        $stmt = $conn->prepare("
            UPDATE solicitudes_viajes 
            SET estado = 'aprobada', 
                fecha_respuesta = NOW(),
                aprobado_por = ?
            WHERE id = ?
        ");
        $stmt->execute([$admin_id, $solicitud['id']]);
        
        // Cambiar el estado del viaje a "en_ruta"
        $stmt = $conn->prepare("UPDATE viajes SET estado = 'en_ruta' WHERE id = ?");
        $stmt->execute([$viaje_id]);
        
        // Commit de la transacción
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Solicitud aprobada exitosamente. El viaje ahora está en ruta.'
        ]);
        
    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Error en aprobar_inicio.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}
?>
