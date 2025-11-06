<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    require_once '../../config.php';
    
    // Verificar autenticación (comentado temporalmente para debug)
    // requireRole(['admin', 'supervisor']);
    
    $db = new Database();
    $conn = $db->getConnection();

    // Obtener parámetros
    $start_date = $_GET['start'] ?? $_GET['start_date'] ?? '';
    $end_date = $_GET['end'] ?? $_GET['end_date'] ?? '';
    $transportista_id = $_GET['transportista_id'] ?? '';

    // Log de parámetros recibidos
    error_log("Reporte Viajes - Parámetros: start=$start_date, end=$end_date, transportista=$transportista_id");

    // Consulta simplificada
    $query = "SELECT v.id, 
                     v.transportista_id,
                     CONCAT(v.origen_estado, ', ', v.origen_municipio) as origen,
                     CONCAT(v.destino_estado, ', ', v.destino_municipio) as destino,
                     v.fecha_programada, 
                     v.estado,
                     u.nombre as transportista_nombre, 
                     vh.placa as vehiculo_placa
             FROM viajes v 
             LEFT JOIN usuarios u ON v.transportista_id = u.id 
             LEFT JOIN vehiculos vh ON v.vehiculo_id = vh.id 
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
    
    // Filtrar por transportista si se especifica
    if ($transportista_id && $transportista_id !== 'all') {
        $query .= " AND v.transportista_id = ?";
        $params[] = $transportista_id;
        error_log("Filtrando por transportista ID: $transportista_id");
    }

    $query .= " ORDER BY v.fecha_programada DESC";

    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calcular estadísticas
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
            case 'en_ruta':
                $stats['en_progreso']++;
                break;
            case 'pendiente':
                $stats['pendientes']++;
                break;
        }
    }

    // Respuesta JSON
    $response = [
        'data' => $data,
        'stats' => $stats
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error al generar el reporte: ' . $e->getMessage(),
        'debug' => $e->getTraceAsString()
    ]);
}
?>
