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
    error_log("Reporte Gastos - Parámetros: start=$start_date, end=$end_date, transportista=$transportista_id");

    // Consulta simplificada
    $query = "SELECT g.id, g.tipo, g.monto, g.fecha, g.descripcion, g.numero_factura, g.estado, g.litros, g.kilometraje,
                     g.usuario_id,
                     u.nombre as usuario_nombre, 
                     v.placa as vehiculo_placa
             FROM gastos g 
             LEFT JOIN usuarios u ON g.usuario_id = u.id 
             LEFT JOIN vehiculos v ON g.vehiculo_id = v.id 
             WHERE 1=1";

    $params = [];
    if ($start_date) {
        $query .= " AND g.fecha >= ?";
        $params[] = $start_date;
    }
    if ($end_date) {
        $query .= " AND g.fecha <= ?";
        $params[] = $end_date;
    }
    
    // Filtrar por transportista si se especifica
    if ($transportista_id && $transportista_id !== 'all') {
        $query .= " AND g.usuario_id = ?";
        $params[] = $transportista_id;
        error_log("Filtrando por transportista ID: $transportista_id");
    }

    $query .= " ORDER BY g.fecha DESC";

    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calcular estadísticas
    $total_monto = 0;
    $combustible_litros = 0;
    $stats_by_type = [];

    foreach ($data as $gasto) {
        $total_monto += floatval($gasto['monto']);
        
        if ($gasto['tipo'] === 'combustible') {
            $combustible_litros += floatval($gasto['litros'] ?? 0);
        }
        
        if (!isset($stats_by_type[$gasto['tipo']])) {
            $stats_by_type[$gasto['tipo']] = 0;
        }
        $stats_by_type[$gasto['tipo']]++;
    }

    $stats = [
        'total_monto' => $total_monto,
        'total_registros' => count($data),
        'promedio_gasto' => count($data) > 0 ? $total_monto / count($data) : 0,
        'combustible_litros' => $combustible_litros,
        'por_tipo' => $stats_by_type
    ];

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
