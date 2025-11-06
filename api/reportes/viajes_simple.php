<?php
// API simple para reportes de viajes - sin complicaciones
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    // Conexión simple a la base de datos
    $pdo = new PDO(
        "mysql:host=localhost;dbname=transporte_pro;charset=utf8mb4",
        "root",
        "",
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    $start_date = $_GET['start_date'] ?? '';
    $end_date = $_GET['end_date'] ?? '';
    
    // Query simple sin complicaciones
    $query = "SELECT v.id, 
                     v.numero_viaje,
                     CONCAT(v.origen_estado, ', ', v.origen_municipio) as origen,
                     CONCAT(v.destino_estado, ', ', v.destino_municipio) as destino,
                     v.fecha_programada, 
                     v.estado,
                     u.nombre as transportista_nombre
              FROM viajes v 
              LEFT JOIN usuarios u ON v.transportista_id = u.id 
              WHERE 1=1";
    
    $params = [];
    if ($start_date) {
        $query .= " AND v.fecha_programada >= ?";
        $params[] = $start_date;
    }
    if ($end_date) {
        $query .= " AND v.fecha_programada <= ?";
        $params[] = $end_date;
    }
    
    $query .= " ORDER BY v.fecha_programada DESC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Estadísticas simples
    $stats = [
        'total' => count($data),
        'completados' => 0,
        'cancelados' => 0,
        'en_progreso' => 0,
        'pendientes' => 0
    ];
    
    foreach ($data as $viaje) {
        switch ($viaje['estado']) {
            case 'completado':
                $stats['completados']++;
                break;
            case 'cancelado':
                $stats['cancelados']++;
                break;
            case 'en_progreso':
                $stats['en_progreso']++;
                break;
            default:
                $stats['pendientes']++;
                break;
        }
    }
    
    // Respuesta simple
    echo json_encode([
        'success' => true,
        'data' => $data,
        'stats' => $stats
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
