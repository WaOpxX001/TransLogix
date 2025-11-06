<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';

try {
    session_start();
    
    // Verificar que el usuario esté logueado
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Usuario no autenticado']);
        exit;
    }
    
    $user_id = $_SESSION['user_id'];
    $user_role = $_SESSION['user_role'] ?? $_SESSION['role'] ?? '';
    
    // Log para debugging
    error_log("Viajes Update - User ID: $user_id, Role: $user_role");
    
    // Obtener datos del PUT/POST
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Log de datos recibidos
    error_log("Viajes Update - Input data: " . json_encode($input));
    
    if (!$input || !isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de viaje requerido']);
        exit;
    }
    
    $viaje_id = $input['id'];
    
    // Verificar que el viaje existe y obtener datos actuales
    $stmt = $pdo->prepare("SELECT * FROM viajes WHERE id = ?");
    $stmt->execute([$viaje_id]);
    $viaje = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$viaje) {
        http_response_code(404);
        echo json_encode(['error' => 'Viaje no encontrado']);
        exit;
    }
    
    // Verificar permisos
    if ($user_role === 'transportista' && $viaje['transportista_id'] != $user_id) {
        http_response_code(403);
        echo json_encode(['error' => 'No tienes permisos para modificar este viaje']);
        exit;
    }
    
    // Determinar qué campos actualizar según el tipo de acción
    $action = $input['action'] ?? 'update';
    
    switch ($action) {
        case 'start':
            // Iniciar viaje
            if ($viaje['estado'] !== 'pendiente') {
                http_response_code(400);
                echo json_encode(['error' => 'Solo se pueden iniciar viajes pendientes']);
                exit;
            }
            
            $sql = "UPDATE viajes SET estado = 'en_ruta', fecha_inicio = NOW(), updated_at = NOW() WHERE id = ?";
            $params = [$viaje_id];
            $message = 'Viaje iniciado exitosamente';
            break;
            
        case 'complete':
            // Completar viaje
            if ($viaje['estado'] !== 'en_ruta') {
                http_response_code(400);
                echo json_encode(['error' => 'Solo se pueden completar viajes en ruta']);
                exit;
            }
            
            $observaciones = $input['observaciones'] ?? '';
            $sql = "UPDATE viajes SET estado = 'completado', fecha_completado = NOW(), observaciones = ?, updated_at = NOW() WHERE id = ?";
            $params = [$observaciones, $viaje_id];
            $message = 'Viaje completado exitosamente';
            break;
            
        case 'cancel':
            // Cancelar viaje (solo admin/supervisor)
            if (!in_array($user_role, ['admin', 'supervisor'])) {
                http_response_code(403);
                echo json_encode(['error' => 'No tienes permisos para cancelar viajes']);
                exit;
            }
            
            $observaciones = $input['observaciones'] ?? 'Viaje cancelado';
            $sql = "UPDATE viajes SET estado = 'cancelado', observaciones = ?, updated_at = NOW() WHERE id = ?";
            $params = [$observaciones, $viaje_id];
            $message = 'Viaje cancelado exitosamente';
            break;
            
        case 'update':
        default:
            // Actualización general (solo admin/supervisor)
            if (!in_array($user_role, ['admin', 'supervisor'])) {
                http_response_code(403);
                echo json_encode([
                    'error' => 'No tienes permisos para editar viajes',
                    'user_role' => $user_role,
                    'required_roles' => ['admin', 'supervisor']
                ]);
                exit;
            }
            
            // Construir query dinámicamente
            $fields = [];
            $params = [];
            
            $allowed_fields = [
                'estado', 'origen_estado', 'origen_municipio', 'origen_direccion',
                'destino_estado', 'destino_municipio', 'destino_direccion',
                'transportista_id', 'vehiculo_id', 'cliente', 'carga_tipo', 
                'carga_peso', 'fecha_programada', 'hora_programada', 'observaciones'
            ];
            
            foreach ($allowed_fields as $field) {
                if (isset($input[$field])) {
                    $fields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
            
            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No hay campos para actualizar']);
                exit;
            }
            
            $fields[] = "updated_at = NOW()";
            $params[] = $viaje_id;
            
            $sql = "UPDATE viajes SET " . implode(', ', $fields) . " WHERE id = ?";
            $message = 'Viaje actualizado exitosamente';
            break;
    }
    
    // Ejecutar la actualización
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute($params);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => $message
        ]);
    } else {
        throw new Exception('Error al actualizar el viaje');
    }
    
} catch (Exception $e) {
    error_log("Error en viajes/update.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor: ' . $e->getMessage()]);
}
?>
