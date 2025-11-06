<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';

try {
    // Obtener conexión a la base de datos
    $db = new Database();
    $pdo = $db->getConnection();
    
    // Verificar que el usuario esté logueado
    $user_id = $_SESSION['user_id'] ?? null;
    $user_role = $_SESSION['user_role'] ?? $_SESSION['role'] ?? '';
    
    if (!$user_id) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado']);
        exit();
    }
    
    // Construir la consulta según el rol del usuario
    $sql = "SELECT v.*, 
                   u.nombre as transportista_nombre,
                   vh.placa as vehiculo_placa,
                   vh.marca as vehiculo_marca,
                   vh.modelo as vehiculo_modelo
            FROM viajes v
            LEFT JOIN usuarios u ON v.transportista_id = u.id
            LEFT JOIN vehiculos vh ON v.vehiculo_id = vh.id";
    
    $params = [];
    
    // Filtrar según el rol
    if ($user_role === 'transportista') {
        $sql .= " WHERE v.transportista_id = ?";
        $params[] = $user_id;
    }
    
    $sql .= " ORDER BY v.id DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $viajes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formatear los datos
    foreach ($viajes as &$viaje) {
        $viaje['transportista_nombre_completo'] = $viaje['transportista_nombre'];
        $viaje['vehiculo_info'] = $viaje['vehiculo_placa'] . ' - ' . $viaje['vehiculo_marca'] . ' ' . $viaje['vehiculo_modelo'];
    }
    
    echo json_encode($viajes);
    
} catch (Exception $e) {
    error_log("Error en viajes/list.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor']);
}
?>
