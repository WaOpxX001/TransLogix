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
    
    // La sesión ya se inicia en config.php
    
    // Verificar autenticación - Modo de prueba: permitir sin sesión
    // Priorizar user_id de la sesión, pero permitir parámetro GET como fallback
    $user_id = $_SESSION['user_id'] ?? $_GET['user_id'] ?? null;
    $viaje_id = $_GET['viaje_id'] ?? null;
    
    if (!$viaje_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID de viaje requerido']);
        exit;
    }
    
    // Buscar solicitud pendiente para este viaje
    $stmt = $conn->prepare("
        SELECT id, estado, fecha_solicitud, fecha_respuesta, motivo_denegacion
        FROM solicitudes_viajes
        WHERE viaje_id = ? AND estado = 'pendiente'
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
        // Verificar si fue rechazada y aún está bloqueada
        // Solo si hay user_id (no en modo de prueba)
        $rechazo = null;
        if ($user_id) {
            $stmt = $conn->prepare("
                SELECT fecha_respuesta, motivo_denegacion, dias_bloqueo, fecha_desbloqueo
                FROM solicitudes_viajes
                WHERE viaje_id = ? 
                AND transportista_id = ? 
                AND estado = 'denegada'
                AND (fecha_desbloqueo IS NULL OR fecha_desbloqueo > NOW())
                ORDER BY fecha_respuesta DESC
                LIMIT 1
            ");
            $stmt->execute([$viaje_id, $user_id]);
            $rechazo = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        if ($rechazo) {
            // Calcular días restantes correctamente
            $fecha_actual = new DateTime();
            $fecha_desbloqueo = new DateTime($rechazo['fecha_desbloqueo']);
            
            // Si la fecha de desbloqueo ya pasó, no está bloqueado
            if ($fecha_desbloqueo <= $fecha_actual) {
                echo json_encode([
                    'success' => true,
                    'tiene_solicitud' => false,
                    'bloqueado' => false
                ]);
            } else {
                // Calcular días restantes (redondeando hacia arriba)
                $interval = $fecha_actual->diff($fecha_desbloqueo);
                $dias_restantes = $interval->days;
                
                // Si es el mismo día pero aún no ha llegado la hora, contar como 1 día
                if ($dias_restantes == 0) {
                    $dias_restantes = 1;
                }
                
                echo json_encode([
                    'success' => true,
                    'tiene_solicitud' => false,
                    'bloqueado' => true,
                    'dias_restantes' => $dias_restantes,
                    'dias_bloqueo_total' => (int)$rechazo['dias_bloqueo'],
                    'fecha_desbloqueo' => $rechazo['fecha_desbloqueo'],
                    'motivo_rechazo' => $rechazo['motivo_denegacion']
                ]);
            }
        } else {
            echo json_encode([
                'success' => true,
                'tiene_solicitud' => false,
                'bloqueado' => false
            ]);
        }
    }
    
} catch (Exception $e) {
    error_log("Error en verificar_solicitud.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}
?>
