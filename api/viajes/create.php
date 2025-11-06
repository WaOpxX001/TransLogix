<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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
    
    $user_role = $_SESSION['user_role'] ?? $_SESSION['role'] ?? '';
    
    // Todos los usuarios autenticados pueden crear viajes
    if (!in_array($user_role, ['admin', 'supervisor', 'transportista'])) {
        http_response_code(403);
        echo json_encode([
            'error' => 'No tienes permisos para crear viajes',
            'user_role' => $user_role,
            'required_roles' => ['admin', 'supervisor', 'transportista']
        ]);
        exit;
    }
    
    // Obtener datos del POST
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos inválidos']);
        exit;
    }
    
    // Validar campos requeridos (actualizados para nuevos campos de ubicación)
    $required_fields = ['origen_estado', 'origen_municipio', 'destino_estado', 'destino_municipio', 'fecha_salida', 'fecha_llegada_estimada', 'transportista_id', 'vehiculo_id'];
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Campo requerido: $field"]);
            exit;
        }
    }
    
    // Generar número de viaje único
    $numero_viaje = null;
    $intentos = 0;
    $max_intentos = 100;
    
    do {
        $intentos++;
        // Buscar el último número de viaje para generar el siguiente
        $stmt = $pdo->query("SELECT numero_viaje FROM viajes ORDER BY id DESC LIMIT 1");
        $ultimo_viaje = $stmt->fetch();
        
        if ($ultimo_viaje) {
            // Extraer el número del último viaje (ej: VJ-004 -> 4)
            $ultimo_numero = intval(str_replace('VJ-', '', $ultimo_viaje['numero_viaje']));
            $siguiente_numero = $ultimo_numero + 1;
        } else {
            // Si no hay viajes, empezar desde 1
            $siguiente_numero = 1;
        }
        
        $numero_viaje = 'VJ-' . str_pad($siguiente_numero, 3, '0', STR_PAD_LEFT);
        
        // Verificar si ya existe este número
        $stmt_check = $pdo->prepare("SELECT COUNT(*) as count FROM viajes WHERE numero_viaje = ?");
        $stmt_check->execute([$numero_viaje]);
        $existe = $stmt_check->fetch()['count'] > 0;
        
        if (!$existe) {
            break; // Número único encontrado
        }
        
        // Si existe, buscar el próximo número disponible
        $stmt = $pdo->query("SELECT MAX(CAST(SUBSTRING(numero_viaje, 4) AS UNSIGNED)) as max_num FROM viajes WHERE numero_viaje LIKE 'VJ-%'");
        $max_result = $stmt->fetch();
        $max_num = $max_result['max_num'] ?? 0;
        $siguiente_numero = $max_num + 1;
        $numero_viaje = 'VJ-' . str_pad($siguiente_numero, 3, '0', STR_PAD_LEFT);
        
    } while ($intentos < $max_intentos);
    
    if ($intentos >= $max_intentos) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo generar un número de viaje único']);
        exit;
    }
    
    // Usar los nuevos campos de ubicación directamente
    $origen_estado = trim($input['origen_estado']);
    $origen_municipio = trim($input['origen_municipio']);
    $origen_lugar = trim($input['origen_lugar'] ?? '');
    
    $destino_estado = trim($input['destino_estado']);
    $destino_municipio = trim($input['destino_municipio']);
    $destino_lugar = trim($input['destino_lugar'] ?? '');
    
    // Separar fecha y hora de salida
    $fecha_hora_salida = new DateTime($input['fecha_salida']);
    $fecha_programada = $fecha_hora_salida->format('Y-m-d');
    $hora_programada = $fecha_hora_salida->format('H:i:s');
    
    // Insertar el viaje con campos de lugar específico
    $sql = "INSERT INTO viajes (
                numero_viaje, 
                origen_estado, 
                origen_municipio, 
                destino_estado, 
                destino_municipio, 
                transportista_id, 
                vehiculo_id, 
                fecha_programada, 
                hora_programada, 
                observaciones,
                estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')";
    
    // Construir descripción completa con lugares específicos si están disponibles
    $descripcion_completa = $input['descripcion'] ?? '';
    if (!empty($origen_lugar) || !empty($destino_lugar)) {
        $descripcion_completa .= "\n\nUbicaciones específicas:";
        if (!empty($origen_lugar)) {
            $descripcion_completa .= "\nOrigen: " . $origen_lugar;
        }
        if (!empty($destino_lugar)) {
            $descripcion_completa .= "\nDestino: " . $destino_lugar;
        }
    }
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([
        $numero_viaje,
        $origen_estado,
        $origen_municipio,
        $destino_estado,
        $destino_municipio,
        $input['transportista_id'],
        $input['vehiculo_id'],
        $fecha_programada,
        $hora_programada,
        trim($descripcion_completa)
    ]);
    
    if ($result) {
        $viaje_id = $pdo->lastInsertId();
        echo json_encode([
            'success' => true,
            'message' => 'Viaje creado exitosamente',
            'id' => $viaje_id,
            'numero_viaje' => $numero_viaje
        ]);
    } else {
        throw new Exception('Error al insertar el viaje');
    }
    
} catch (Exception $e) {
    error_log("Error en viajes/create.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor: ' . $e->getMessage()]);
}
?>
