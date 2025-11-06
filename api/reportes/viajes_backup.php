<?php
// Disable error display to prevent HTML output
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(0);

// Start output buffering to capture any unwanted output
ob_start();

try {
    // Log inicio
    error_log("=== INICIO REPORTE VIAJES ===");
    error_log("GET params: " . json_encode($_GET));
    
    require_once '../../config.php';
    error_log("Config cargado correctamente");
    
    requireRole(['admin', 'supervisor']);
    error_log("Rol verificado correctamente");
    
    $db = new Database();
    $conn = $db->getConnection();
    error_log("Conexión a base de datos establecida");

$start_date = $_GET['start'] ?? $_GET['start_date'] ?? '';
$end_date = $_GET['end'] ?? $_GET['end_date'] ?? '';
$format = $_GET['format'] ?? 'json';

error_log("Parámetros procesados - start_date: $start_date, end_date: $end_date, format: $format");

// Si no hay fecha de fin, usar la fecha actual
if (!$end_date && $start_date) {
    $end_date = date('Y-m-d');
    error_log("Fecha fin ajustada a: $end_date");
}

$query = "SELECT v.id, 
                 CONCAT(v.origen_estado, ', ', v.origen_municipio) as origen,
                 CONCAT(v.destino_estado, ', ', v.destino_municipio) as destino,
                 v.fecha_programada, v.hora_programada,
                 v.estado, v.observaciones,
                 u.nombre as transportista_nombre, 
                 CONCAT(vh.marca, ' ', vh.modelo, ' (', vh.placa, ')') as vehiculo_info
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

$query .= " ORDER BY v.fecha_programada DESC";

// Log para debugging
error_log("Query de reportes: " . $query);
error_log("Parámetros: " . json_encode($params));

try {
    $stmt = $conn->prepare($query);
    error_log("Query preparado correctamente");
    
    $stmt->execute($params);
    error_log("Query ejecutado correctamente");
    
    $data = $stmt->fetchAll();
    error_log("Datos obtenidos: " . count($data) . " registros");
    
    if (count($data) > 0) {
        error_log("Primer registro: " . json_encode($data[0]));
    }
} catch (PDOException $e) {
    error_log("Error en query: " . $e->getMessage());
    throw new Exception("Error en consulta de base de datos: " . $e->getMessage());
}

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
        case 'en_progreso':
            $stats['en_progreso']++;
            break;
        case 'pendiente':
            $stats['pendientes']++;
            break;
    }
}

// Manejar diferentes formatos de salida
switch ($format) {
    case 'csv':
        generateCSV($data, $stats, 'reporte_viajes_' . date('Y-m-d') . '.csv');
        break;
    case 'pdf':
        generatePDF($data, $stats, 'Reporte de Viajes', $start_date, $end_date);
        break;
    default:
        // Clean any unwanted output
        ob_clean();
        header('Content-Type: application/json; charset=utf-8');
        $response = [
            'data' => $data,
            'stats' => $stats
        ];
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        ob_end_flush();
}

function sendResponse($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
}

function generateCSV($data, $stats, $filename) {
    // Clear any previous output
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
    
    $output = fopen('php://output', 'w');
    
    // Estadísticas primero
    fputcsv($output, ['ESTADÍSTICAS DE VIAJES']);
    fputcsv($output, ['Total de Viajes', $stats['total']]);
    fputcsv($output, ['Completados', $stats['completados']]);
    fputcsv($output, ['Cancelados', $stats['cancelados']]);
    fputcsv($output, ['En Progreso', $stats['en_progreso']]);
    fputcsv($output, ['Pendientes', $stats['pendientes']]);
    fputcsv($output, []);
    
    // Encabezados de datos
    fputcsv($output, [
        'ID', 'Origen', 'Destino', 'Fecha Programada', 'Hora Programada', 
        'Estado', 'Transportista', 'Vehículo', 'Observaciones'
    ]);
    
    // Datos
    foreach ($data as $row) {
        fputcsv($output, [
            $row['id'],
            $row['origen'],
            $row['destino'],
            date('d/m/Y', strtotime($row['fecha_programada'])),
            $row['hora_programada'] ?? 'N/A',
            ucfirst($row['estado']),
            $row['transportista_nombre'] ?? 'Sin asignar',
            $row['vehiculo_info'] ?? 'Sin asignar',
            $row['observaciones'] ?? ''
        ]);
    }
    
    fclose($output);
    exit;
}

function generatePDF($data, $stats, $title, $start_date, $end_date) {
    // Clear any previous output
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    // Generar HTML para PDF
    $html = '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>' . $title . '</title>
        <style>
            body { font-family: Arial, sans-serif; font-size: 12px; }
            .header { text-align: center; margin-bottom: 20px; }
            .period { color: #666; margin-bottom: 20px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-box { text-align: center; padding: 10px; border: 1px solid #ddd; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .amount { text-align: right; }
            .status-completado { background-color: #d4edda; }
            .status-cancelado { background-color: #f8d7da; }
            .status-en_progreso { background-color: #d1ecf1; }
            .status-pendiente { background-color: #fff3cd; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>TransportePro</h1>
            <h2>' . $title . '</h2>
            <div class="period">Período: ' . date('d/m/Y', strtotime($start_date)) . ' - ' . date('d/m/Y', strtotime($end_date)) . '</div>
        </div>
        
        <div class="stats">
            <div class="stat-box">
                <h3>' . $stats['total'] . '</h3>
                <p>Total de Viajes</p>
            </div>
            <div class="stat-box">
                <h3>' . $stats['completados'] . '</h3>
                <p>Completados</p>
            </div>
            <div class="stat-box">
                <h3>' . $stats['cancelados'] . '</h3>
                <p>Cancelados</p>
            </div>
            <div class="stat-box">
                <h3>' . $stats['en_progreso'] . '</h3>
                <p>En Progreso</p>
            </div>
            <div class="stat-box">
                <h3>' . $stats['pendientes'] . '</h3>
                <p>Pendientes</p>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Origen</th>
                    <th>Destino</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Transportista</th>
                </tr>
            </thead>
            <tbody>';
    
    foreach ($data as $row) {
        $html .= '<tr class="status-' . $row['estado'] . '">
            <td>' . $row['id'] . '</td>
            <td>' . htmlspecialchars($row['origen']) . '</td>
            <td>' . htmlspecialchars($row['destino']) . '</td>
            <td>' . date('d/m/Y', strtotime($row['fecha_programada'])) . '</td>
            <td>' . ($row['hora_programada'] ?? 'N/A') . '</td>
            <td>' . ucfirst($row['estado']) . '</td>
            <td>' . htmlspecialchars($row['transportista_nombre'] ?? 'Sin asignar') . '</td>
        </tr>';
    }
    
    $html .= '</tbody>
        </table>
        
        <div style="margin-top: 30px; font-size: 10px; color: #666;">
            Generado el ' . date('d/m/Y H:i:s') . ' por TransportePro
        </div>
    </body>
    </html>';
    
    // Enviar como descarga HTML (que se puede imprimir como PDF)
    header('Content-Type: text/html; charset=utf-8');
    header('Content-Disposition: attachment; filename="reporte_viajes_' . date('Y-m-d') . '.html"');
    echo $html;
    exit;
}

} catch (Exception $e) {
    error_log("=== ERROR EN VIAJES.PHP ===");
    error_log("Mensaje: " . $e->getMessage());
    error_log("Archivo: " . $e->getFile());
    error_log("Línea: " . $e->getLine());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    // Clean any unwanted output
    if (ob_get_level()) {
        ob_clean();
    }
    
    // Asegurar que el content-type esté configurado
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
    }
    
    echo json_encode([
        'error' => 'Error al generar el reporte: ' . $e->getMessage(),
        'debug' => false
    ]);
    
    if (ob_get_level()) {
        ob_end_flush();
    }
    exit;
}
?>
